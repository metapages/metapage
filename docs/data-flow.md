---
layout: page
title: Data Flow
permalink: /data-flow/
---
<script src="/js/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true});</script>
        

# Metapage Data flow



***

metapage sends *inputs* to metaframe


metaframe setup

<div class="mermaid" style="width: 100%;">
sequenceDiagram
    participant P as metapage
    participant F as metaframe
    P->>F: creation
    F-->>P: register request
    Note right of P: unknown origin
    Note right of P: sent to all
    P->>F: {state, iframeId, parentId}
    Note right of F: registered (once)
    Note right of F: initial inputs set
    Note right of F: send update events

</div>

***


metaframe sets inputs

<div class="mermaid" style="width: 100%;">
sequenceDiagram
    participant P as metapage
    participant F as metaframe
    Note right of F: sets inputs
    F-->>P: new inputs
    Note right of P: stores updates only
    Note right of F: send update events

</div>

***


metaframe sets outputs

<div class="mermaid" style="width: 100%;">
sequenceDiagram
    participant P as metapage
    participant F as metaframe
    Note right of F: sets outputs
    F-->>P: new outputs
    Note right of P: stores updates
    Note right of P: send downstream
    Note right of F: this is a different
    Note right of F: child metaframe
    P-->>F: new inputs

</div>


Describes the order and sequence of data as it flows from metaframe to metaframe.

Inside a metaframe, the `metaframe` object



Talk about observables:
https://medium.com/@jacobp100/you-arent-using-redux-with-observables-enough-b59329c5a3af




## Concepts

When you create a metaframe,

Within a metaframe, input data is handled by an [observable](http://reactivex.io/documentation/observable.html). The metaframe object emits the entire *state* upon each state change. The state object is immutable


The metaframe object is a [redux store]()

[Immutable](https://redux.js.org/faq/immutable-data)

You can listen to the 

Taking directly from the redux website:

The Store is also an [Observable](https://github.com/tc39/proposal-observable), so you can `subscribe` to changes with libraries like [RxJS](https://github.com/ReactiveX/RxJS).
