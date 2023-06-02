import { launch } from 'puppeteer';
import { writeFileSync } from 'fs';
import { URL } from 'url';
import path from 'path';
import { JSDOM } from 'jsdom';

// Modify the URLs in the HTML content
function modifyHtmlUrls(html, folder, url) {
  const { document } = new JSDOM(html).window;

  const links = document.querySelectorAll('a[href], link[href], script[src]');
  const headLinks = document.head.querySelectorAll('link[href][as="script"], script[src]');
  const images = document.querySelectorAll('img[src]');
  const allLinks = [...links, ...headLinks, ...images];

  allLinks.forEach((link) => {
    const attrType = link.getAttribute('href') ? 'href' : link.getAttribute('src') ? 'src' : null;
    const attrValue = link.getAttribute('href') || link.getAttribute('src');

    if (attrType && attrValue.startsWith('http')) {
      const url = new URL(attrValue);
      if (url.origin === url) {
        const relativePath = path.relative(folder, url.pathname);
        const resolvedUrl = new URL(relativePath, url);
        link.setAttribute(attrType, resolvedUrl.href + url.search + url.hash);
      }
    } else if (attrType && attrValue.startsWith('/')) {
      const resolvedUrl = new URL(attrValue, url);
      link.setAttribute(attrType, resolvedUrl.href);
    }
  });

  const serializedDocument = document.documentElement.outerHTML;

  return serializedDocument;
}

async function generateHtml(folder, url) {
  let browser;
  try {
    console.log('Start generating the index.html file for "%s"...', url);
    // Launch a headless Chrome browser
    browser = await launch({ headless: 'new', dumpio: true, slowMo: 500 });

    // prevent puppeteer from failing when one of our many console exceptions are thrown
    process.on('uncaughtException', function (err) {
      console.log('Caught exception: ' + err);
    });

    // Create a new page
    const page = await browser.newPage();

    // Navigate to your app's URL
    await page.goto(url, { waitUntil: "domcontentloaded" }) // Replace with your app's URL

    // Set screen size
    await page.setViewport({ width: 1200, height: 1024 });

    // Capture the HTML content of the page
    const htmlContent = await page.content();

    // Modify the URLs in the HTML content to be relative paths
    const modifiedHtmlContent = modifyHtmlUrls(htmlContent, folder, url);

    // Save the HTML content to the index.html file
    writeFileSync(`${folder}/index.html`, modifiedHtmlContent);

    console.log('index.html generated successfully!');
  } catch (error) {
    console.error('Error generating index.html:', error);
  } finally {
    // Close the browser
      await browser.close();
  }
};

export default generateHtml;
