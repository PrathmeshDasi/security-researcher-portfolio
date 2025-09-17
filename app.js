// Project: Security Researcher Portfolio Website (Node.js + Express + EJS)
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// App Setup
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'super-secure-secret',
  resave: false,
  saveUninitialized: false
}));
const helmet = require('helmet');
app.use(helmet());

app.use(express.static('public'));


const rateLimit = require('express-rate-limit');

// Limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login attempts. Try again later."
});
app.use('/admin/login', loginLimiter);

// Limit contact form abuse
const contactLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: "Too many messages. Please wait a few minutes."
});
app.use('/contact', contactLimiter);





// Dummy Data
const findings = [
  {
    title: "Unauthenticated Access to debug.log",
    category: "Security Misconfiguration",
    description: "Discovered a publicly accessible debug.log file exposing internal stack traces and system behavior. Reported to a live bug bounty program and rewarded.",
    reward: "$1014 Bounty Awarded",
    tools: ["Browser", "Manual Recon", "Burp Suite"]
  }
];

const resources = [
  { name: "HackerOne", url: "https://www.hackerone.com" },
  { name: "Bugcrowd", url: "https://www.bugcrowd.com" },
  { name: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" },
  { name: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security" },
  { name: "Recon Tools List", url: "https://github.com/projectdiscovery" }
];

const blogPosts = [
  {
    title: "What is Bug Bounty Hunting?",
    content: "Bug bounty hunting is the process of finding vulnerabilities in software or web applications and reporting them responsibly to organizations. It is often rewarded through monetary payouts known as bounties.",
    tags: ["introduction", "getting started"]
  },
  {
    title: "My Favorite Recon Tools",
    content: "I often use ffuf for fuzzing, httpx for HTTP probing, and Subfinder for subdomain enumeration. These tools help me gather useful information before testing.",
    tags: ["recon", "tools"]
  }
];

// Middleware: Auth check
function isAuthenticated(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/admin/login');
}

app.use(session({
  secret: 'super-secure-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set to true if using HTTPS
    maxAge: 1 * 60 * 60 * 1000 // 1 hour
  }
}));





// === Public Routes ===
app.get('/', (req, res) => {
  res.render('index', { page: 'Home', findings, blogPosts });
});

app.get('/about', (req, res) => res.render('about', { page: 'About' }));
app.get('/findings', (req, res) => res.render('findings', { findings, page: 'Findings' }));
app.get('/resources', (req, res) => res.render('resources', { resources, page: 'Resources' }));
app.get('/blog', (req, res) => res.render('blog', { blogPosts, page: 'Blog' }));

// Contact (GET)
app.get('/contact', (req, res) => {
  res.render('contact', { page: 'Contact', message: null });
});

// Contact (POST with Email via Nodemailer)
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});


 const mailOptions = {
  from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`, // still YOU
  to: process.env.EMAIL_USER,                              // also YOU
  replyTo: email,                                          // this is KEY ✅
  subject: '📥 New Message from Portfolio Contact Form',
  text: `You received a new message:

Name: ${name}
Email: ${email}

Message:
${message}`
};


  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully.");
    res.render('contact', { page: 'Contact', message: "Thank you! Your message was sent." });
  } catch (error) {
    console.error("❌ Email failed:", error);
    res.render('contact', { page: 'Contact', message: "Oops! Message could not be sent." });
  }
});

// === Admin Auth Routes ===
app.get('/admin/login', (req, res) => {
  res.render('admin/login', { page: 'Admin Login', error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.redirect('/admin/dashboard');
  } else {
    res.render('admin/login', { page: 'Admin Login', error: 'Invalid credentials' });
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// === Admin Dashboard ===
app.get('/admin/dashboard', isAuthenticated, (req, res) => {
  res.render('admin/dashboard', { page: 'Dashboard', blogPosts, findings });
});

app.get('/learn/getting-started', (req, res) => {
  res.render('learn/getting-started', { page: 'Getting Started' });
});

app.get('/learn/bug-bounty', (req, res) => {
  res.render('learn/bug-bounty', { page: 'Bug Bounty' });
});

app.get('/learn/tools', (req, res) => {
  res.render('learn/tools', { page: 'Tools' });
});

app.get('/learn/ctfs', (req, res) => {
  res.render('learn/ctfs', { page: `CTF's` });
});

app.get('/learn/guides', (req, res) => {
  res.render('learn/guides', { page: `Guides` });
});

app.get('/learn/certifications', (req, res) => {
  res.render('learn/certifications', { page: `Certifications` });
});

app.get('/learn/career-tips', (req, res) => {
  res.render('learn/career-tips', { page: `Career Tips` });
});


  const sanitizeHtml = require('sanitize-html');

// === Admin Blog Management ===
app.post('/admin/add-blog', isAuthenticated, (req, res) => {
  const { title, content, tags } = req.body;
  blogPosts.unshift({ title, content, tags: tags.split(',').map(t => t.trim()) });
  res.redirect('/admin/dashboard');


const cleanInput = sanitizeHtml(req.body.content, {
  allowedTags: [ 'b', 'i', 'em', 'strong', 'code', 'ul', 'li', 'p', 'a' ],
  allowedAttributes: {
    'a': ['href']
  }
});
});

app.post('/admin/delete-blog', isAuthenticated, (req, res) => {
  const { title } = req.body;
  const index = blogPosts.findIndex(post => post.title === title);
  if (index !== -1) blogPosts.splice(index, 1);
  res.redirect('/admin/dashboard');
});



// === Admin Blog Management ===
app.post('/admin/add-blog', isAuthenticated, (req, res) => {
  const { title, content, tags } = req.body;

  const cleanTitle = sanitizeHtml(title);
  const cleanContent = sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'code', 'p', 'ul', 'li', 'a'],
    allowedAttributes: { 'a': ['href'] }
  });
  const cleanTags = tags.split(',').map(t => sanitizeHtml(t.trim()));

  blogPosts.unshift({ title: cleanTitle, content: cleanContent, tags: cleanTags });
  res.redirect('/admin/dashboard');
});

app.post('/admin/delete-blog', isAuthenticated, (req, res) => {
  const { title } = req.body;
  const index = blogPosts.findIndex(post => post.title === title);
  if (index !== -1) blogPosts.splice(index, 1);
  res.redirect('/admin/dashboard');
});

// === Admin Findings Management ===
app.post('/admin/add-finding', isAuthenticated, (req, res) => {
  const { title, category, description, reward, tools } = req.body;
  findings.unshift({
    title: sanitizeHtml(title),
    category: sanitizeHtml(category),
    description: sanitizeHtml(description),
    reward: sanitizeHtml(reward),
    tools: tools.split(',').map(tool => sanitizeHtml(tool.trim()))
  });
  res.redirect('/admin/dashboard');
});

app.post('/admin/delete-finding', isAuthenticated, (req, res) => {
  const { title } = req.body;
  const index = findings.findIndex(finding => finding.title === title);
  if (index !== -1) findings.splice(index, 1);
  res.redirect('/admin/dashboard');
});


// // === Admin Findings Management ===
// app.post('/admin/add-finding', isAuthenticated, (req, res) => {
//   const { title, category, description, reward, tools } = req.body;
//   findings.unshift({
//     title,
//     category,
//     description,
//     reward,
//     tools: tools.split(',').map(tool => tool.trim())
//   });
//   res.redirect('/admin/dashboard');


// app.post('/admin/add-blog', isAuthenticated, (req, res) => {
//   const { title, content, tags } = req.body;

//   const cleanTitle = sanitizeHtml(title);
//   const cleanContent = sanitizeHtml(content, {
//     allowedTags: ['b', 'i', 'em', 'strong', 'code', 'p', 'ul', 'li'],
//     allowedAttributes: {}
//   });

//   const cleanTags = tags.split(',').map(t => sanitizeHtml(t.trim()));

//   blogPosts.unshift({ title: cleanTitle, content: cleanContent, tags: cleanTags });
//   res.redirect('/admin/dashboard');
// });

// });

// app.post('/admin/delete-finding', isAuthenticated, (req, res) => {
//   const { title } = req.body;
//   const index = findings.findIndex(finding => finding.title === title);
//   if (index !== -1) findings.splice(index, 1);
//   res.redirect('/admin/dashboard');
// });

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🌐 Portfolio running at http://localhost:${PORT}`);
});
