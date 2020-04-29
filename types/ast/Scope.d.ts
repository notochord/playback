export default class Scope {
    defaultVars: Map<string, any>;
    vars: Map<string, any>;
    name: string;
    type: string;
    scope: Scope;
    constructor();
    inherit(): void;
    init(scope: any): void;
}
