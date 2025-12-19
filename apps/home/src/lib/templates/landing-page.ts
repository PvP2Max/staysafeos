/**
 * Pre-built landing page template for Growth tier
 * This template provides a professional starting point that users
 * can customize with their own text and images.
 */

export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  thumbnail?: string;
}

// Default landing page template for Growth tier
export const defaultLandingPageTemplate: LandingPageTemplate = {
  id: "default-landing",
  name: "Classic Landing Page",
  description: "A clean, professional landing page template with hero, features, and contact sections",
  html: `
<header class="site-header">
  <div class="header-container">
    <div class="logo">
      <img src="https://via.placeholder.com/150x50?text=Your+Logo" alt="Organization Logo" class="logo-image" />
    </div>
    <nav class="main-nav">
      <a href="#features" class="nav-link">Features</a>
      <a href="#about" class="nav-link">About</a>
      <a href="#contact" class="nav-link">Contact</a>
      <a href="#request-ride" class="nav-link cta-button">Request Ride</a>
    </nav>
  </div>
</header>

<section class="hero-section">
  <div class="hero-content">
    <h1 class="hero-title">Safe Rides Home</h1>
    <p class="hero-subtitle">Free, confidential rides for students. No questions asked. Your safety is our priority.</p>
    <div class="hero-buttons">
      <a href="#request-ride" class="btn btn-primary">Request a Ride</a>
      <a href="#about" class="btn btn-secondary">Learn More</a>
    </div>
  </div>
  <div class="hero-image">
    <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop" alt="Safe driving" />
  </div>
</section>

<section id="features" class="features-section">
  <div class="section-header">
    <h2 class="section-title">Why Choose Us</h2>
    <p class="section-subtitle">We're committed to keeping our community safe</p>
  </div>
  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
      </div>
      <h3 class="feature-title">Completely Free</h3>
      <p class="feature-description">Our service is 100% free for students. No cost, no catches, just safe rides home.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      </div>
      <h3 class="feature-title">Trained Volunteers</h3>
      <p class="feature-description">All our drivers are trained, vetted volunteers dedicated to your safety.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      <h3 class="feature-title">Confidential</h3>
      <p class="feature-description">Your privacy matters. We never share your information or ask questions.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      </div>
      <h3 class="feature-title">Available Nights</h3>
      <p class="feature-description">Operating Thursday through Saturday nights when you need us most.</p>
    </div>
  </div>
</section>

<section id="about" class="about-section">
  <div class="about-content">
    <div class="about-text">
      <h2 class="section-title">About Our Program</h2>
      <p class="about-description">We are a student-run organization dedicated to preventing drunk driving in our community. Since our founding, we've provided thousands of safe rides home.</p>
      <p class="about-description">Our mission is simple: get you home safely, no questions asked. Whether you've been drinking or just don't feel comfortable driving, we're here for you.</p>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">5,000+</span>
          <span class="stat-label">Safe Rides</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">100+</span>
          <span class="stat-label">Volunteers</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">10+</span>
          <span class="stat-label">Years Active</span>
        </div>
      </div>
    </div>
    <div class="about-image">
      <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=400&fit=crop" alt="Our team" />
    </div>
  </div>
</section>

<section id="contact" class="contact-section">
  <div class="section-header">
    <h2 class="section-title">Get In Touch</h2>
    <p class="section-subtitle">Have questions? We're here to help.</p>
  </div>
  <div class="contact-content">
    <div class="contact-info">
      <div class="contact-item">
        <strong>Phone:</strong> (555) 123-4567
      </div>
      <div class="contact-item">
        <strong>Email:</strong> contact@example.edu
      </div>
      <div class="contact-item">
        <strong>Hours:</strong> Thu-Sat, 10PM - 3AM
      </div>
    </div>
  </div>
</section>

<section id="request-ride" class="cta-section">
  <div class="cta-content">
    <h2 class="cta-title">Ready for a Safe Ride?</h2>
    <p class="cta-description">Download our app or give us a call. We'll get you home safely.</p>
    <div class="cta-buttons">
      <a href="#" class="btn btn-primary btn-large">Download App</a>
      <a href="tel:5551234567" class="btn btn-secondary btn-large">Call Now</a>
    </div>
  </div>
</section>

<footer class="site-footer">
  <div class="footer-content">
    <p class="footer-text">Powered by <a href="https://staysafeos.com" target="_blank" rel="noopener">StaySafeOS</a></p>
    <p class="footer-copyright">&copy; 2024 Your Organization. All rights reserved.</p>
  </div>
</footer>
`.trim(),

  css: `
/* Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1a1a1a;
}

img {
  max-width: 100%;
  height: auto;
}

a {
  text-decoration: none;
  color: inherit;
}

/* Header */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
  padding: 1rem 2rem;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-image {
  height: 40px;
  width: auto;
}

.main-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  font-weight: 500;
  color: #4a5568;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #2563eb;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: transparent;
  color: #2563eb;
  border: 2px solid #2563eb;
}

.btn-secondary:hover {
  background: #2563eb;
  color: white;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

.cta-button {
  background: #2563eb;
  color: white !important;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.cta-button:hover {
  background: #1d4ed8;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  padding: 8rem 2rem 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rem;
  max-width: 1200px;
  margin: 0 auto;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #4a5568;
  margin-bottom: 2rem;
  max-width: 500px;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
}

.hero-image {
  flex: 1;
}

.hero-image img {
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}

/* Sections */
.section-header {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
}

/* Features Section */
.features-section {
  padding: 5rem 2rem;
  background: #f8fafc;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.feature-icon {
  color: #2563eb;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.feature-description {
  color: #6b7280;
  font-size: 0.95rem;
}

/* About Section */
.about-section {
  padding: 5rem 2rem;
}

.about-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 4rem;
}

.about-text {
  flex: 1;
}

.about-description {
  color: #4a5568;
  margin-bottom: 1rem;
}

.about-image {
  flex: 1;
}

.about-image img {
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  color: #2563eb;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
}

/* Contact Section */
.contact-section {
  padding: 5rem 2rem;
  background: #f8fafc;
}

.contact-content {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-item {
  font-size: 1.1rem;
  color: #4a5568;
}

/* CTA Section */
.cta-section {
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  text-align: center;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.cta-section .btn-primary {
  background: white;
  color: #2563eb;
}

.cta-section .btn-primary:hover {
  background: #f1f5f9;
}

.cta-section .btn-secondary {
  border-color: white;
  color: white;
}

.cta-section .btn-secondary:hover {
  background: white;
  color: #2563eb;
}

/* Footer */
.site-footer {
  padding: 2rem;
  background: #1a1a1a;
  color: white;
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

.footer-text {
  margin-bottom: 0.5rem;
}

.footer-text a {
  color: #60a5fa;
}

.footer-text a:hover {
  text-decoration: underline;
}

.footer-copyright {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding-top: 6rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-buttons {
    justify-content: center;
  }

  .about-content {
    flex-direction: column;
  }

  .main-nav {
    display: none;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}
`.trim(),
};

// Get template with organization branding applied
export function getTemplateWithBranding(
  template: LandingPageTemplate,
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    organizationName?: string;
  }
): LandingPageTemplate {
  let html = template.html;
  let css = template.css;

  // Replace logo placeholder
  if (branding?.logoUrl) {
    html = html.replace(
      /https:\/\/via\.placeholder\.com\/150x50\?text=Your\+Logo/g,
      branding.logoUrl
    );
  }

  // Replace organization name in footer
  if (branding?.organizationName) {
    html = html.replace(
      /Your Organization/g,
      branding.organizationName
    );
  }

  // Replace primary color
  if (branding?.primaryColor) {
    css = css.replace(/#2563eb/g, branding.primaryColor);
  }

  return {
    ...template,
    html,
    css,
  };
}

// All available templates
export const templates: LandingPageTemplate[] = [
  defaultLandingPageTemplate,
];
