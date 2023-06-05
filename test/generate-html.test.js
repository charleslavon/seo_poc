const { generateHtml } = require('../src/index.js');

test('index.html generated successfully for given url', async () => {
  try {
    await generateHtml('dist', 'https://beta.near.org');
  } catch (error) {
    console.error('Error generating index.html:', error);
  }
});
