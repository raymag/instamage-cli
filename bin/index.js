#!/usr/bin/env node
const { program } = require('commander');
const puppeteer = require('puppeteer');
const fs = require('fs');
const fetch = require('node-fetch')
const chalk = require('chalk');
const figlet = require('figlet');

figlet('InstaMage', (err, data) => {
    console.log(chalk.yellow(data))
})

program
    .version('1.0.0')
    .description('Downloads pictures from a given instagram username.')
    .option('-u, --username <username>', 'Instagram username')
    .option('-d, --directory <directory>', 'Directory to save images')
    .parse(process.argv);

if (process.argv.length == 2) console.log(program.helpInformation());

const autoScroll = async (page) => {
    return await page.evaluate(async () => {
        return await new Promise((resolve, reject) => {
            const distance = 100;
            var totalHeight = 0;
            var imgs = [];
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                
                document.querySelectorAll('img.FFVAD').forEach(img => {
                    if (!imgs.includes(img.src)) {
                        imgs.push(img.src);
                    }
                })

                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve(imgs);
                }
            }, 100);
        });
    });
}

const createDir = (prefix, path) => {
    if (path && !fs.existsSync(`${path}/${prefix}`)){
        fs.mkdirSync(`${path}/${prefix}`);
    } else {
        if (!fs.existsSync(`./${prefix}`)) {
            fs.mkdirSync(`./${prefix}`);
        }
    }
}

const downloadImages = async (paths, prefix, directory) => {
    createDir(prefix, directory);
    paths.forEach( async (path, i) => {
        try {
            const response = await fetch(path);
            const buffer = await response.buffer();
            var saveDirectory = directory;
            if (directory) {
                saveDirectory = '.';
            }
            fs.writeFile(`${saveDirectory}/${prefix}/${prefix}_${i}.jpg`, buffer, () => console.log(`- Finished downloading ${prefix}_${i}.jpg`));
        } catch (error) {
            console.log(`- You might want to check ${path}...`);
        }
    });
}

const formatDirectoryPath = (directory) => {
    if (directory) {
        directory = directory.replace(/\\/g, "/");
        if (directory.charAt(directory.length-1) === '/'){
            return directory.substr(0, directory.length-1);
        }
    } else {
        return '.';
    }
}

const downloadImagesFromInstagram = (username, directory) => {
    console.log(`username: ${username}`);
    (async () => {
        const browser = await puppeteer.launch({
            headless: true
        });
        const page = await browser.newPage();
        await page.goto(`https://instagram.com/${username}`);
        await page.setViewport({
            width: 1200,
            height: 800
        });
        directory = formatDirectoryPath(directory);
        console.log("Scrapping for images links...");
        const imgs = await autoScroll(page);
        await downloadImages(imgs, username, directory);
      
        await browser.close();
      })();
}

if (program.username){
    downloadImagesFromInstagram(program.username, program.directory);
}