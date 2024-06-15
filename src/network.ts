import * as grpc from '@grpc/grpc-js';
import {
    ConnectOptions,
    Identity,
    Signer,
    signers,
} from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';

interface IGrpcConnection {
    tlsRootCert: string;
    peerEndPoint: string;
    peerHostAlias: string;
}

export interface IIdentity {
    mspId: string;
    cert: string;
}

export interface ISigner {
    privateKey: string;
}

export interface INetwork {
    newConnectOptions(NewIdentityDto: IIdentity, NewSignerDto: ISigner): ConnectOptions;
}

export class Network implements INetwork{
    private connection: grpc.Client;

    constructor(
        private NewGrpcConnectionDto: IGrpcConnection,
    ) 
    {
        this.connection = this.newGrpcConnection(this.NewGrpcConnectionDto);
    }

    private newGrpcConnection(NewGrpcConnectionDto: IGrpcConnection): grpc.Client {
        const tlsCredentials = grpc.credentials.createSsl(Buffer.from(NewGrpcConnectionDto.tlsRootCert, 'utf-8'));
        const conn = new grpc.Client(NewGrpcConnectionDto.peerEndPoint.split("grpcs://")[1], tlsCredentials, {
            'grpc.ssl_target_name_override': NewGrpcConnectionDto.peerHostAlias,
            'grpc.max_reconnect_backoff_ms': 10000,
        });

        return conn
    }

    public newConnectOptions(NewIdentityDto: IIdentity, NewSignerDto: ISigner): ConnectOptions {
        return {
            client: this.connection,
            identity: this.newIdentity(NewIdentityDto),
            signer: this.newSigner(NewSignerDto),
            // Default timeouts for different gRPC calls
            evaluateOptions: () => {
                return { deadline: Date.now() + 5000 }; // 5 seconds
            },
            endorseOptions: () => {
                return { deadline: Date.now() + 15000 }; // 15 seconds
            },
            submitOptions: () => {
                return { deadline: Date.now() + 5000 }; // 5 seconds
            },
            commitStatusOptions: () => {
                return { deadline: Date.now() + 60000 }; // 1 minute
            },
        };
    }

    private newIdentity(NewIdentityDto: IIdentity): Identity {
        return { mspId: NewIdentityDto.mspId, credentials: Buffer.from(NewIdentityDto.cert, 'utf-8') };
    }

    private newSigner(NewSignerDto: ISigner): Signer {
        const privateKey = crypto.createPrivateKey(Buffer.from(NewSignerDto.privateKey, 'utf-8'));
        return signers.newPrivateKeySigner(privateKey);
    }


}