import { IIdentity, INetwork, ISigner, Network } from "./network";
import { Hyperledger } from "./hyperledger";
import express, { Request, Response } from 'express';
import path from 'path';
import bodyParser from 'body-parser';

async function callHyperledger(profile: string, orgnization: string, method: "query" | "invoke", channel: string, chaincode: string, func: string, params: string[]) {


    const connectionProfile = require(`../connection-profiles/${profile}.json`)

    const network = new Network({
        peerEndPoint: connectionProfile.peers["peer0.org1.example.com"].url,
        peerHostAlias: "peer0.org1.example.com",
        tlsRootCert: connectionProfile.peers["peer0.org1.example.com"].tlsCACerts.pem
    })

    const hyperledger = new Hyperledger(network);

    let result, txId;

    const org = require(`../identity/${orgnization}.json`);

    const identity: IIdentity = {
        mspId: org.mspId,
        cert: org.credentials.certificate
    }

    const signer: ISigner = {
        privateKey: org.credentials.privateKey
    }

    if (method == "query") {
        const response = await hyperledger.queryChaincode(identity, signer, channel, chaincode, func, params);
        result = response.result;
    }

    if (method == "invoke") {
        const response = await hyperledger.invokeChaincode(identity, signer, channel, chaincode, func, params);
        result = "Successfully submitted transaction to the ledger."
        txId = response.txId;
    }

    return { result, txId };

}




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
    res.render('pages/index', { title: 'Hyperledger Fabric Chaincode Playground', result: '', func: "", params: "", txId: "" });
});

// Submit a form
app.post('/submit', async (req: Request, res: Response) => {
    const { channel, chaincode, func, params, method, org, profile } = req.body;
    const { result, txId } = await callHyperledger(profile, org, method, channel, chaincode, func, params.split(','));
    const strResult = JSON.stringify(result, null, 2);
    res.render('pages/index', { title: 'Result', result: strResult, txId, func, params });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
