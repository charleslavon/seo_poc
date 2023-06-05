"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHtml = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const url_1 = require("url");
const path_1 = __importDefault(require("path"));
const jsdom_1 = require("jsdom");
// Modify the URLs in the HTML content
function modifyHtmlUrls(html, folder, url) {
    const { document } = new jsdom_1.JSDOM(html).window;
    const links = document.querySelectorAll('a[href], link[href], script[src]');
    const headLinks = document.head.querySelectorAll('link[href][as="script"], script[src]');
    const images = document.querySelectorAll('img[src]');
    const allLinks = [...links, ...headLinks, ...images];
    allLinks.forEach((link) => {
        const attrType = link.getAttribute('href') ? 'href' : link.getAttribute('src') ? 'src' : null;
        const attrValue = link.getAttribute('href') || link.getAttribute('src');
        if (attrType && attrValue && attrValue.startsWith('http')) {
            const urlObject = new url_1.URL(attrValue);
            if (urlObject.origin === url) {
                const relativePath = path_1.default.relative(folder, urlObject.pathname);
                const resolvedUrl = new url_1.URL(relativePath, urlObject);
                link.setAttribute(attrType, resolvedUrl.href + urlObject.search + urlObject.hash);
            }
        }
        else if (attrType && attrValue && attrValue.startsWith('/')) {
            const resolvedUrl = new url_1.URL(attrValue, url);
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
        browser = await puppeteer_1.default.launch({ headless: 'new', dumpio: true, slowMo: 500 });
        // Prevent puppeteer from failing when one of our many console exceptions is thrown
        process.on('uncaughtException', function (err) {
            console.log('Caught exception: ' + err);
        });
        // Create a new page
        const page = await browser.newPage();
        // Navigate to your app's URL
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        // Set screen size
        await page.setViewport({ width: 1200, height: 1024 });
        // Capture the HTML content of the page
        const htmlContent = await page.content();
        // Modify the URLs in the HTML content to be relative paths
        const modifiedHtmlContent = modifyHtmlUrls(htmlContent, folder, url);
        // Save the HTML content to the index.html file
        if (!fs_1.default.existsSync(folder)) {
            fs_1.default.mkdirSync(folder);
        }
        fs_1.default.writeFileSync(`${folder}/index.html`, modifiedHtmlContent);
        console.log('index.html generated successfully!');
    }
    catch (error) {
        console.error('Error generating index.html:', error);
    }
    finally {
        // Close the browser
        if (browser) {
            await browser.close();
        }
    }
}
exports.generateHtml = generateHtml;
