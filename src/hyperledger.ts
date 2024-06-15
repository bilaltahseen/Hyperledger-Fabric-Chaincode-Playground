import { IIdentity, INetwork, ISigner } from "./network";
import org1 from "../identity/org1.json";
import { connect } from '@hyperledger/fabric-gateway';

export class Hyperledger {
    private network: INetwork;
    private utf8Decoder = new TextDecoder();

    constructor(network: INetwork) {
        this.network = network;
    }

    public async invokeChaincode(identity: IIdentity, signer: ISigner, channel: string, chaincode: string, func: string, params: string[]) {

        const connectOptions = this.network.newConnectOptions(identity, signer);
        const gateway = connect(connectOptions);
        const network = gateway.getNetwork(channel);
        const contract = network.getContract(chaincode);

        const proposal = contract.newProposal(func, { arguments: params })
        const transaction = await proposal.endorse();
        const commit = await transaction.submit();

        const result = commit.getResult();
        const decodedResult = this.JSONParse(this.utf8Decoder.decode(result));
        const txId = commit.getTransactionId();
        return { result: decodedResult, txId };
    }

    public async queryChaincode(identity: IIdentity, signer: ISigner, channel: string, chaincode: string, func: string, params: string[]) {

        const connectOptions = this.network.newConnectOptions(identity, signer);
        const gateway = connect(connectOptions);
        const network = gateway.getNetwork(channel);
        const contract = network.getContract(chaincode);

        const result = await contract.evaluateTransaction(func, ...params);
        const decodedResult = this.JSONParse(this.utf8Decoder.decode(result));
        return { result: decodedResult };

    }

    private JSONParse<T>(data: string): T {
        try {
            return JSON.parse(data) as T;
        }
        catch (e) {
            return data as unknown as T;
        }
    }
}