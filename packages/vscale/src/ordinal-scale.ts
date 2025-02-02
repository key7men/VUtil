import { ScaleEnum } from './type';
import type { DiscreteScaleType, IBaseScale } from './interface';
import { BaseScale } from './base-scale';
import { isValid } from '@visactor/vutils';

export const implicit = Symbol('implicit');

export class OrdinalScale extends BaseScale implements IBaseScale {
  readonly type: DiscreteScaleType = ScaleEnum.Ordinal;
  protected _index: Map<string, number>;
  protected _domain: Array<number>;
  protected _ordinalRange: Array<number>;
  /** specified: support scale to return specific value on special input value */
  protected _specified: Record<string, unknown>;
  specified(): Record<string, unknown>;
  specified(_: Record<string, unknown>): this;
  specified(_?: Record<string, unknown>): this | Record<string, unknown> {
    if (!_) {
      return Object.assign({}, this._specified);
    }
    this._specified = Object.assign(this._specified ?? {}, _);
    return this;
  }

  protected _getSpecifiedValue(input: string): undefined | any {
    if (!this._specified) {
      return undefined;
    }
    return this._specified[input];
  }

  constructor() {
    super();
    this._index = new Map();
    this._domain = [];
    this._ordinalRange = [];
    this._unknown = implicit;
  }

  // TODO checkPoint
  clone(): IBaseScale {
    return new OrdinalScale().domain(this._domain).range(this._ordinalRange).unknown(this._unknown);
  }

  calculateVisibleDomain(range: any[]) {
    if (isValid(this._rangeFactorStart) && isValid(this._rangeFactorEnd) && range.length === 2) {
      const d0 = this.invert(range[0]);
      const d1 = this.invert(range[1]);

      return [d0, d1];
    }

    return this._domain;
  }

  scale(d: any): any {
    const key = `${d}`;
    const special = this._getSpecifiedValue(key);
    if (special !== undefined) {
      return special;
    }
    let i = this._index.get(key);
    if (!i) {
      if (this._unknown !== implicit) {
        return this._unknown;
      }
      // TODO checkPoint
      i = this._domain.push(d);
      this._index.set(key, i);
    }
    const output = this._ordinalRange[(i - 1) % this._ordinalRange.length];

    return this._fishEyeTransform ? this._fishEyeTransform(output) : output;
  }

  // d3-scale里没有对ordinal-scale添加invert能力，这里只做简单的映射
  invert(d: any): any {
    // 找到index
    let i = 0;
    while (i < this._ordinalRange.length && this._ordinalRange[i] !== d) {
      i++;
    }
    return this._domain[(i - 1) % this._domain.length];
  }

  domain(): any[];
  domain(_: any[]): this;
  domain(_?: any[]): this | any {
    if (!_) {
      return this._domain.slice();
    }
    this._domain = [];
    this._index = new Map();
    for (const value of _) {
      const key = `${value}`;
      if (this._index.has(key)) {
        continue;
      }
      this._index.set(key, this._domain.push(value));
    }
    return this;
  }

  range(): any[];
  range(_: any[]): this;
  range(_?: any[]): this | any {
    if (!_) {
      return this._ordinalRange.slice();
    }
    const nextRange = Array.from(_);

    this._ordinalRange = nextRange;
    return this;
  }
}
