I want to make sure that a meta page can be more easily updated. So I want the setDefinition function in Metapage.ts to be changed
to updateDefinition. Then it will emit an event with the updated definition and we need to be able Able to emit the metaframes also
Where only new metaframes are actually created and And existing metaframes Do not get recreated. It's really important that we keep
existing iframes for existing metaframes. However, if a metaframe has a new URL Then we set the iframe with that new URL and try to be
 as minimally disruptive as possible. This might involve changes to the events and maybe we need a new event that updates the
metaframes. The whole point of this is that downstream listeners get a consistent set of metaframe iframes That will be as least
disruptive as possible. It's probably worth including any deleted metaframes in the update event, containing the deleted metaframe
ids. If there are metaframes They are no longer existing due to the update Then the metaframe should be properly disposed So that
downstream consumers do not have to worry about cleaning up the iframe (it should be removed from the dom and set to be garbage
collected). If there are any other aspects of this that could help in rapid modification without destructive recreation, let me know
of your ideas.