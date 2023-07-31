import puppeteer, { Page, ElementHandle } from 'puppeteer';
import fs from 'fs';
import yaml from 'js-yaml';
import logger from './log_conf';
import RankDataProcessor from './process_data';
import util from 'util';

/**
 * Represents the configuration for the scraper, defined in the YAML config file.
 * URL - The URL to scrape.
 * SELECTOR - The CSS selector to find the elements to scrape.
 * HEADER - The header text that should be ignored in the scraped data.
 */
interface Config {
    URL: string;
    SELECTOR: string;
    SUBSELECTOR: string;
}

let config: Config;

try {
    const configFile = fs.readFileSync('app_conf.yml', 'utf8');
    config = yaml.load(configFile) as Config;
    logger.info(`Configuration loaded from app_conf.yml`);
} catch (error) {
    if (error instanceof Error) {
        logger.error(`Failed to load configuration from app_conf.yml: ${error.message}`);
    } else {
        // This will handle situations where the thrown error isn't an instance of Error.
        logger.error(`Failed to load configuration from app_conf.yml: ${error}`);
    }
    throw error;
}

/**
 * Extracts the text content from each DOM element that matches the provided CSS selector.
 * 
 * @param page - The Puppeteer page instance to run the selector on.
 * @param selector - The CSS selector to use for finding elements.
 * 
 * @returns An array of strings, each representing the text content of a matched element.
 */
async function extractDataFromElement(page: Page, selector: string, subselector: string): Promise<string[]> {
    logger.info(`Extracting text from selector ${selector} with subselector ${subselector}`);
    
    let tables: ElementHandle;
    let firstTable: ElementHandle[];
    try {
        const tableElements = await page.$$(selector);
        tables = tableElements[0];
        firstTable = await tables?.$$(subselector);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Failed to select elements using the selector "${selector}": ${error.message}`);
        } else {
            // This will handle situations where the thrown error isn't an instance of Error.
            logger.error(`Failed to select elements using the selector "${selector}": ${error}`);
        }
        throw error;
    }

    const texts: string[] = [];
    for (const el of firstTable) {
        let textContent: string;
        try {
            textContent = await el.evaluate((node: Element) => node.textContent ? node.textContent.trim() : '');
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`Failed to evaluate text content of an element: ${error.message}`);
            } else {
                // This will handle situations where the thrown error isn't an instance of Error.
                logger.error(`Failed to evaluate text content of an element: ${error}`);
            }
            continue; // If we fail to get the text from one element, we skip it and continue with the next
        }
        
        texts.push(textContent);
    }

    if (texts.length === 0) {
        logger.error(`No elements found for selector "${selector}" or failed to extract text from them.`);
    }
    
    return texts;
}




/**
 * Scrapes a webpage at the provided URL, using the specified CSS selector to find elements. Each matching element's
 * text content is processed as a line of data representing a league rank and associated percentage.
 * 
 * @param url - The URL of the webpage to scrape.
 * @param selector - The CSS selector to use for finding elements.
 * 
 * @returns A RankDataProcessor instance containing the processed rank data, or null if an error occurred during scraping.
 */
async function scrapeUrl(url: string, selector: string, subselector: string): Promise<RankDataProcessor | null> {
    logger.info(`URL: ${url}, SELECTOR: ${selector}, SUBSELECTOR: ${subselector}`);
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        let textData = await extractDataFromElement(page, selector, subselector);
        textData = textData.map(item => item.replace(/\s\s+/g, ' ').replace(/\n/g, ' '));
        if (textData.length !== 0) {
            let rankData: string[] = []
            textData.map((data) => {
                const [rank1, rank2] = data.split('% ');
                if (rank1 && rank2){
                    rankData.push(rank1 + '%', rank2);
                } else if (rank1) {
                    rankData.push(rank1);
                }
            })
            const processedData = new RankDataProcessor(rankData);
            return processedData;
        } else {
            logger.warn(`No data extracted from page. Check your CSS selector and ensure the page structure hasn't changed.`);
        }
    } catch (err) {
        logger.error(`Error scraping URL ${url}: ${err}`);
        return null;
    } finally {
        await browser.close();
        logger.info(`Browser closed after scraping URL ${url}`);
    }

    return null;

}

scrapeUrl(config.URL, config.SELECTOR, config.SUBSELECTOR)
    .then(processedData => {
        if (processedData) {
            logger.info(`Scraped data processed successfully`);
            logger.debug(util.inspect(processedData, { showHidden: false, depth: null }));
        } else {
            logger.error("Failed to scrape data");
        }
    })
    .catch(error => {
        logger.error(`Error occurred during the scrape process: ${error.message}`);
    });
