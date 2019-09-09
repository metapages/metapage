---
layout   : default-with-mermaid
title    : Data Flow
parent   : Documentation
nav_order: 3
---        

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
