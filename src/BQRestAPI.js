import axios from 'axios'
import googleAuth from 'google-auto-auth'

const auth = googleAuth();

async function authenticateOpts(opts) {
    return new Promise((resolve, reject) => {
        auth.authorizeRequest(opts, (err, authorizedOpts) => {
            if (err) {
                reject(err)
            } else {
                resolve(authorizedOpts);
            }
        })
    })
}

export default function BigQuery({projectId}) {
    return {
        query: async (queryString) => {
            const opts = {
                method: 'POST',
                url: `https://www.googleapis.com/bigquery/v2/projects/${projectId}/queries`,
                data: {
                    kind: "bigquery#queryRequest",
                    query: queryString
                }
            };
            const authOpts = await authenticateOpts(opts);
            const {data} = await axios(authOpts);
        }
    }
}