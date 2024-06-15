

async function callHyperledger(method: "query" | "invoke", channel: string, chaincode: string, func: string, params: string[]) {

    const network = new Network({
        peerEndPoint: connectionOrg1.peers["peer0.org1.example.com"].url,
        peerHostAlias: "peer0.org1.example.com",
        tlsRootCert: connectionOrg1.peers["peer0.org1.example.com"].tlsCACerts.pem
    })

    const hyperledger = new Hyperledger(network);

    let result, txId;

    if (method == "query") {
        const response = await hyperledger.queryChaincode(channel, chaincode, func, params);
        result = response.result;
    }

    if (method == "invoke") {
        const response = await hyperledger.invokeChaincode(channel, chaincode, func, params);
        result = "Successfully submitted transaction to the ledger."
        txId = response.txId;
    }

    return { result, txId };

}

// main();

import { Network } from "./network";
import { Hyperledger } from "./hyperledger";
import connectionOrg1 from "../connection-profiles/connection-org1.json";
import express, { Request, Response } from 'express';
import path from 'path';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Define a route
app.get('/', (req: Request, res: Response) => {
    res.render('pages/index', { title: 'Hyperledger Fabric Chaincode Playground', result: '' });
});

// Submit a form
app.post('/submit', async (req: Request, res: Response) => {
    const { channel, chaincode, func, params, method } = req.body;
    const { result, txId } = await callHyperledger(method, channel, chaincode, func, params.split(','));
    const strResult = JSON.stringify(result, null, 2);
    res.render('pages/index', { title: 'Result', result: strResult, txId, func, params });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
