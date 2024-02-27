// relationship between two addresses

export interface Address {
  address: string;
  coin: string;
}

export interface AddressLink {
  addressA: Address;
  addressB: Address;
}
