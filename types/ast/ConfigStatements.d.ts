import Scope from './Scope';
import FunctionCall from './FunctionCall';
import GlobalScope from './GlobalScope';
export declare class MetaStatement extends Scope {
    functionCalls: FunctionCall[];
    constructor(functionCalls: FunctionCall[]);
    init(scope: GlobalScope): void;
}
export declare class OptionsStatement extends Scope {
    functionCalls: FunctionCall[];
    constructor(functionCalls: any);
    init(scope: GlobalScope): void;
}
export declare class ImportStatement {
    path: string;
    identifier: string;
    constructor(path: any, identifier: any);
}
