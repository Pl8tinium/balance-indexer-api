// relationship between two addresses

export interface Address {
    address: string;
    coin: string;
}

export class AddressLink {
    addressA: Address;
    addressB: Address;

    constructor(addressA: Address, addressB: Address) {
        this.addressA = addressA;
        this.addressB = addressB;
    }
}