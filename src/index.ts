import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import { URL } from 'url';
import path from 'path';
import { JSDOM } from 'jsdom';

// Modify the URLs in the HTML content
function modifyHtmlUrls(html: string, folder: string, url: string): string {
  const { document } = new JSDOM(html).window;

  const links = document.querySelectorAll('a[href], link[href], script[src]');
  const headLinks = document.head.querySelectorAll('link[href][as="script"], script[src]');
  const images = document.querySelectorAll('img[src]');
  const allLinks = [...links, ...headLinks, ...images];

  allLinks.forEach((link) => {
    const attrType = link.getAttribute('href') ? 'href' : link.getAttribute('src') ? 'src' : null;
    const attrValue = link.getAttribute('href') || link.getAttribute('src');

    if (attrType && attrValue && attrValue.startsWith('http')) {
      const urlObject = new URL(attrValue);
      if (urlObject.origin === url) {
        const relativePath = path.relative(folder, urlObject.pathname);
        const resolvedUrl = new URL(relativePath, urlObject);
        link.setAttribute(attrType, resolvedUrl.href + urlObject.search + urlObject.hash);
      }
    } else if (attrType && attrValue && attrValue.startsWith('/')) {
      const resolvedUrl = new URL(attrValue, url);
      link.setAttribute(attrType, resolvedUrl.href);
    }
  });

  const serializedDocument = document.documentElement.outerHTML;

  return serializedDocument;
}

export async function generateHtml(folder: string, url: string): Promise<void> {
  let browser: Browser | undefined;
  try {
    console.log('Start generating the index.html file for "%s"...', url);
    // Launch a headless Chrome browser
    browser = await puppeteer.launch({ headless: 'new', dumpio: true, slowMo: 500 });

    // Prevent puppeteer from failing when one of our many console exceptions is thrown
    process.on('uncaughtException', function (err: Error) {
      console.log('Caught exception: ' + err);
    });

    // Create a new page
    const page: Page = await browser.newPage();

    // Navigate to your app's URL
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Set screen size
    await page.setViewport({ width: 1200, height: 1024 });

    // Capture the HTML content of the page
    const htmlContent: string = await page.content();

    // Modify the URLs in the HTML content to be relative paths
    const modifiedHtmlContent: string = modifyHtmlUrls(htmlContent, folder, url);

    // Save the HTML content to the index.html file
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    fs.writeFileSync(`${folder}/index.html`, modifiedHtmlContent);

    console.log('index.html generated successfully!');
  } catch (error) {
    console.error('Error generating index.html:', error);
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
    }
  }
}
