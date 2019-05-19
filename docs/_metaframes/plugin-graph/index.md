---
layout: vanilla
---

<script src="https://unpkg.com/mermaid@8.0.0/dist/mermaid.min.js"></script>
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
