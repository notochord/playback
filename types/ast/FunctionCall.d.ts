import SongIterator from 'notochord-song/types/songiterator';
import Scope from './Scope';
declare type FunctionDefinition = {
    types: (Function | string)[] | '*';
    scope: 'meta' | 'options' | 'no-config' | 'pattern' | 'no-meta';
    returns: string | Function | symbol;
    execute: (args: any[], songIterator: SongIterator, scope: Scope) => any;
};
/**
 * If the value is a FunctionCall, call it and return the returned value.
 * Otherwise, return the value itself.
 * @private
 */ export default class FunctionCall {
    identifier: string;
    definition: FunctionDefinition;
    args: any[];
    scope: Scope;
    returns: string | Function | symbol;
    /**
     * @constructor
     * @param {string} identifier The name of the function. Ideally it should
     * match the name of one of the functions in function_data.js
     */
    constructor(identifier: any, args: any);
    init(scope: Scope): void;
    link(ASTs: any, parentStyle: any, parentTrack: any): void;
    execute(songIterator?: SongIterator): any;
}
export {};
