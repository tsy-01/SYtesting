const Tesseract = require('tesseract.js');

async function recognizeCaptcha(imagePath) {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
  return text.trim();
}