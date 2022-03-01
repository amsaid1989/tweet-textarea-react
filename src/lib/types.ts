export interface INodeAndOffset {
    node: Element | ChildNode;
    offset: number;
}

export interface INullNodeAndOffset {
    node: null;
    offset: null;
}

export interface IRangeStartAndEnd {
    start: INodeAndOffset;
    end: INodeAndOffset;
}

export interface INodeTriplet {
    active: ChildNode;
    start: INodeAndOffset;
    end: INodeAndOffset;
}
