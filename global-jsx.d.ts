import type * as React from "react";

declare global {
  namespace JSX {
    export type Element = React.JSX.Element;
    export type ElementClass = React.JSX.ElementClass;
    export type ElementAttributesProperty = React.JSX.ElementAttributesProperty;
    export type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute;
    export type LibraryManagedAttributes<C, P> =
      React.JSX.LibraryManagedAttributes<C, P>;
    export type IntrinsicAttributes = React.JSX.IntrinsicAttributes;
    export type IntrinsicClassAttributes<T> =
      React.JSX.IntrinsicClassAttributes<T>;
    export type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}
