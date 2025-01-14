import type { AstSymbol } from 'jsymbol';
import { SymbolTable } from 'jsymbol';

import { ErrorException } from './errors';

export enum BindingsSpace {
  USER = 'USER',
  ADDR = 'ADDR',
  ABI = 'ABI',
  INTERPRETER = 'INTERPRETER',
}

interface Binding extends AstSymbol<string> {
  value: any;
}

export class BindingsManager {
  #bindings: SymbolTable<Binding>;

  constructor() {
    this.#bindings = new SymbolTable<Binding>((b) => b.identifier);
  }

  enterScope(): void {
    this.#bindings.enterScope();
  }

  exitScope(): void {
    this.#bindings.exitScope();
  }

  getBinding(name: string, space: BindingsSpace): any {
    return this.#getBinding(name, space);
  }

  getCustomBinding(name: string, space: string): any {
    return this.#getBinding(name, space);
  }

  hasBinding(name: string, memSpace: BindingsSpace): boolean {
    return !!this.#getBinding(name, memSpace);
  }

  setBinding(
    name: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    value: any,
    memSpace: BindingsSpace,
    isGlobal = false,
  ): void {
    this.#setBinding(name, value, memSpace, isGlobal);
  }

  setCustomBinding(
    name: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    value: any,
    type: string,
    isGlobal = false,
  ): void {
    this.#setBinding(name, value, type, isGlobal);
  }

  #setBinding(
    identifier: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    value: any,
    type: string,
    isGlobal: boolean,
  ): void {
    const binding: Binding = {
      identifier: identifier,
      value,
      type,
    };
    try {
      if (isGlobal) {
        this.#bindings.addToGlobalScope(binding);
      } else {
        this.#bindings.add(binding);
      }
    } catch (err) {
      throw new ErrorException(
        `${
          isGlobal ? 'global' : ''
        } binding ${identifier} already exists on current scope of ${type} memory space`,
      );
    }
  }

  #getBinding(identifier: string, type: string): any {
    const binding = this.#bindings.lookup(identifier, type);

    return binding && binding.length ? binding[0].value : undefined;
  }
}
