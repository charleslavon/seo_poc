import generateHtml from "../lib";

test('index.html generated successfully for given url', () => {
  generateHtml('build', 'https://beta.near.org');
});
