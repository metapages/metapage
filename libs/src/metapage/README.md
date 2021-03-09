I'd like the initialize steps to be:

1. set metapage definition and state (input + output values of metaframes). Not pipes yet.
2. start iframes
3. iframes
	- can't send messages until parent sends init package that includes initial values (inputs+outputs)
	- sends init request to parent
	- parent sends init package in response, incl inputs+outputs
	- get init package, updates outputs (which does nothing), then inputs, then allow events that trigger downstream code, and potentially output updates. Ignore when outputs match, push downstream if outputs are different.
4. there is no way to reliably wait until all child metaframes are ready, they point to internet resources that can be down, but you don't want the rest of the metapgae to be down. So the next step does not wait for the previous step to complete.
5. Set all pipes. No need to pipe values because the initial state is already set.