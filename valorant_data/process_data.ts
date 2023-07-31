import { Decimal } from 'decimal.js';
import logger from './log_conf';

/**
 * Interface for the rank data object.
 * 
 * @interface
 * 
 * @property {string} tier - The tier of the league rank.
 * 
 * @property {Decimal} rankPercentage - The percentage of players at or above this rank.
 * 
 * @property {Decimal} cumulativePercentage - The cumulative percentage of players at or above this rank.
 */
interface RankData {
    tier: string;
    rankPercentage: Decimal;
    cumulativePercentage: Decimal;
}

            

/**
 * Processes a list of league ranks with associated percentages. Adjusts the percentages (if necessary) so that they sum up to 100.
 */
class RankDataProcessor {
    public processedData: RankData[];

    /**
     * Creates a new RankDataProcessor instance.
     *
     * Processes a list of league ranks with associated percentages. Adjusts the percentages (if necessary) so that they sum up to 100.
     * 
     * @param lines - An array of strings, each representing a league rank and associated percentage.
     * 
     * @returns A new RankDataProcessor instance, with the processed data returned as its value.
     * 
     * @usage const processedData = new RankDataProcessor(lines);
     */
    constructor(lines: string[]) {
        try {
            this.processedData = this.adjustPercentages(this.parseLines(lines));
            logger.info("RankDataProcessor instance created successfully.");
        } catch(error) {
            if (error instanceof Error) {
                logger.error(`Error occurred while creating RankDataProcessor instance: ${error.message}`);
            } else {
                // This will handle situations where the thrown error isn't an instance of Error.
                logger.error(`Error occurred while creating RankDataProcessor instance: ${error}`);
            }
            throw error;
        }
    }

    /**
     * Parses lines into an array of objects, each containing a tier, rank percentage, and cumulative percentage.
     *
     * @param lines - An array of strings, each representing a league rank and associated percentage.
     * @returns An array of objects, each containing a tier, rank percentage, and cumulative percentage.
     */
    private parseLines(lines: string[]): RankData[] {
        // The regex matches a sequence at the start of the line containing letters and optional spaces/digits,
        // followed by a space and a percentage. This accommodates for league ranks like 'Iron 1' as well as 'Radiant'.
        let regex = /^([a-zA-Z\s]*\d*)\s(\d+.\d+)%/;


        let cumulativePercentage = new Decimal(0);
        let processedData: RankData[] = [];
    
        for(let line of lines) {
            let match = line.match(regex);
    
            if (match) {
                let tier = match[1].trim();
                let rankPercentage = new Decimal(match[2]);
                cumulativePercentage = cumulativePercentage.plus(rankPercentage);
                processedData.push({ tier, rankPercentage, cumulativePercentage });
            } else {
                logger.error(`Could not parse line: "${line}"`);
                throw new Error(`Could not parse line: "${line}"`);
            }
        }
    
        logger.info("Lines parsed successfully.");
        return processedData;
    }

    /**
     * Adjusts the percentages in the processed data so that they sum up to 100.
     *
     * @param processedData - An array of objects, each containing a tier, rank percentage, and cumulative percentage.
     * @returns An array of objects, each containing a tier, rank percentage, and cumulative percentage, adjusted so that they sum up to 100.
     */
    private adjustPercentages(processedData: RankData[]): RankData[] {
        try {
            const totalInaccuracy = new Decimal(100).minus(processedData[processedData.length - 1].cumulativePercentage);
            let cumulativePercentage = new Decimal(0);

            for (let item of processedData) {
                item.rankPercentage = item.rankPercentage.plus(item.rankPercentage.dividedBy(100).times(totalInaccuracy));
                cumulativePercentage = cumulativePercentage.plus(item.rankPercentage);
                item.cumulativePercentage = cumulativePercentage;
            }

            logger.info("Percentages adjusted successfully.");
            return processedData;
        } catch(error) {
            
            if (error instanceof Error) {
                logger.error(`Error occurred while creating RankDataProcessor instance: ${error.message}`);
                logger.error(`Error occurred while adjusting percentages: ${error.message}`);
                throw new Error(`Error occurred while adjusting percentages: ${error.message}`);
            } else {
                // This will handle situations where the thrown error isn't an instance of Error.
                logger.error(`Error occurred while adjusting percentages: ${error}`);
                throw new Error(`Error occurred while adjusting percentages: ${error}`);
            }
        }
    }
}

export default RankDataProcessor;
