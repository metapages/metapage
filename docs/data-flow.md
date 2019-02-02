---
layout: page
title: Data Flow
permalink: /data-flow/
---

# Metapage Data flow

Describes the order and sequence of data as it flows from metaframe to metaframe.

Inside a metaframe, the `metaframe` object






## Concepts

When you create a metaframe,

Within a metaframe, input data is handled by an [observable](http://reactivex.io/documentation/observable.html). The metaframe object emits the entire *state* upon each state change. The state object is immutable


The metaframe object is a [redux store]()

[Immutable](https://redux.js.org/faq/immutable-data)

You can listen to the 

Taking directly from the redux website:

The Store is also an [Observable](https://github.com/tc39/proposal-observable), so you can `subscribe` to changes with libraries like [RxJS](https://github.com/ReactiveX/RxJS).
