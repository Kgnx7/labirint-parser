#!/usr/bin/env node

const fs = require('fs');
const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');

const source = 'https://www.labirint.ru/',
  queryUrl = 'search/',
  pageUrl = '&page='

try {
  const mode = process.argv[2];

  switch (mode) {
    case '-s':
      search();
      break;
    case '-g':
      getOne();
      break;

    default:
      throw new Error();
  }

} catch (error) {
  console.log('Неверные аргументы')
}


function search() {
  try {
    const query = process.argv[3];
    let searchPage = null;

    if (process.argv[4] === '-p') {
      searchPage = process.argv[5];

      if (typeof parseInt(searchPage) !== 'number') throw new Error();
    }

    (async () => {
      const browser = await puppeteer.launch({ ignoreDefaultArgs: ['--disable-extensions'], headless: false });
      const page = await browser.newPage();
      const userAgent = new UserAgent();

      page.setUserAgent(userAgent.toString());

      let fullQuery = source + queryUrl + query;
      if (searchPage !== null) fullQuery += pageUrl + searchPage;

      await page.setDefaultNavigationTimeout(0);
      await page.goto(fullQuery, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.products-row');

      const listItem = await page.evaluate(async () => {
        function delay(ms) {
          return new Promise((resolve) => { setTimeout(resolve, ms) })
        }
        const items = [...document.querySelectorAll('.card-column')]
        for (const item of items) {
          item.scrollIntoView()
          await delay(100)
        }

        return items.map(item => ({
          title: item.querySelector('.product-title').textContent.trim(),
          price: item.querySelector('.price-val > span').textContent.trim(),
          author: item.querySelector('.product-author a') && item.querySelector('.product-author a').title.trim(),
          image: item.querySelector('.book-img-cover').src.trim(),
        }));
      }
      )

      fs.writeFileSync('output.json', JSON.stringify(listItem));

      await browser.close();
    })();
  } catch (error) {
    console.log('Не удалось сделать запрос');
  }
}