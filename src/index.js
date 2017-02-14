import BigQuery from '@google-cloud/bigquery'
import "console.table"
const projectId = 'INSERT_PROJECT_ID';
const bigQuery = BigQuery({
    projectId
});

const TRIVIAL_QUERY = `SELECT 1`;
const genQuery  = () => `SELECT ${Math.floor(Math.random() * 100)}`;

async function testQuery() {
    const startTime = (new Date()).getTime();
    const [job] = await bigQuery.startQuery({
        query: genQuery(),
        useLegacySQL: false
    });
    const jobPostTime = (new Date()).getTime() - startTime;
    await job.promise();
    const jobCompleteTime = (new Date()).getTime() - startTime - jobPostTime;
    const [rows] = await job.getQueryResults();
    const rowFetchTime = (new Date()).getTime() - startTime - jobPostTime - jobCompleteTime;
    return {jobPostTime, jobCompleteTime, rowFetchTime};
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

async function runTrials(trialCount) {
    const timingPromises = [...new Array(trialCount)].map(i => testQuery());
    const timings = await Promise.all(timingPromises);
    const keys = ['jobPostTime', 'jobCompleteTime', 'rowFetchTime'];
    const stats = keys.map(k => ({key: k, ...summaryStats(timings.map(t => t[k]))}));
    console.log(`Timings for ${trialCount} concurrent queries`);
    console.table(stats);
    return stats;
}

async function main() {
    const trialSizes = [1,2,4,8,16,32,64, 128];
    console.log(`Testing BQ on randomized "SELECT {n}" statements with ${trialSizes.join(', ')} concurrent queries`);
    try {
        for (let size of trialSizes) {
            const stats = await runTrials(size);
        }

    } catch (err) {
        console.error(`${err.message} ${err.stack}`);
    }
}

main();