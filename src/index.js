import BigQuery from './BQRestAPI'
import ProgressBar from "progress"
import "console.table"

const projectId = process.env.GOOGLE_PROJ_ID;

const genQuery  = () => `SELECT ${Math.floor(Math.random() * 100)}`;
const bigQuery = BigQuery({projectId});

async function testQuery() {
    const startTime = (new Date()).getTime();
    await bigQuery.query(genQuery());
    const endTime = (new Date()).getTime();
    return {completeTime: endTime - startTime}
}

function summaryStats(arr) {
    const total = arr.reduce((a, b) => a + b, 0);
    const max = Math.round(arr.reduce((a, b) => Math.max(a, b), Number.NEGATIVE_INFINITY));
    const min = Math.round(arr.reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY));
    const avg = Math.round(total / arr.length);
    return {
        avg, max, min
    }
}

async function stressTest(concurrencyCount, trialCount) {
    const timings = new Array(trialCount);
    const bar = new ProgressBar('[:bar] :percent', {total: trialCount});
    for (let i = 0; i < trialCount; i++) {
        bar.tick();
        timings[i] = await Promise.all(
            [... new Array(concurrencyCount)].map(i => testQuery())
        );
    }
    const timingsGrid = timings.map(trials => trials.map(t => t.completeTime));
    const timingsArray = [].concat.apply([], timingsGrid);
    const min = Math.min(...timingsArray);
    const max = Math.max(...timingsArray);
    const avg = timingsArray.reduce((a, b) => a + b, 0) / timingsArray.length;
    console.log(`Overall Stats\n\tMin:${min}\n\tMax:${max}\n\tAvg:${avg}\nTrial Stats:`);
    console.table(timingsGrid.map((row, idx) => ({trial: idx, ...summaryStats(row)})));
    return timingsGrid;
}

async function main() {
    const concurrencyCount = process.env.CCOUNT || 32; // Number of concurrent queries to run
    const trialCount = process.env.TCOUNT || 100; // Number of iterations to run the test

    if (!projectId) {
        console.error('Need to provide project id in GOOGLE_PROJ_ID environment variable!');
        return;
    }
    try {
        console.log(`Stress test of ${concurrencyCount} concurrent queries for ${trialCount} trials`);``
        await stressTest(concurrencyCount, trialCount);
    } catch (err) {
        console.error(`${err.message} ${err.stack}`);
    }
}



main();