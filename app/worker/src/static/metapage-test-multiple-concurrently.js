// Download the specific metaframe library version
const url = new URL(window.location.href);
var version = url.pathname.split('/').filter(e => e !== '')[3] || "latest"; 
const importURl = `${version === "latest" ? "/lib/metapage/index.js" : "https://cdn.jsdelivr.net/npm/@metapages/metapage@" + version.split("-")[0]}`;
const { Metaframe } = await import(importURl);

const debug = ["debug", "mp_debug"].reduce((exists, flag) => {
    return exists || url.searchParams.get(flag) === "true" || url.searchParams.get(flag) === "1"
}, false);
if (debug) {
    console.log("❗🏗️ FRAME debug");
}

const messagePassingMetapageDefinition = {
    "meta": {
      "layouts": {
        "react-grid-layout": {
          "docs": "https://www.npmjs.com/package/react-grid-layout",
          "props": {
            "cols": 12,
            "margin": [20, 40],
            "rowHeight": 100,
            "containerPadding": [5, 5]
          },
          "layout": [
            {
              "h": 2,
              "i": "metapage1",
              "w": 6,
              "x": 0,
              "y": 0
            },
            {
              "h": 2,
              "i": "metapage2", 
              "w": 6,
              "x": 6,
              "y": 0
            }
          ]
        }
      }
    },
    "version": "2",
    "metaframes": {
      "metapage1": {
        "url": "https://js.mtfm.io/#?editorWidth=80&js=JTJGJTJGJTIwQ29udGludW91cyUyMG1lc3NhZ2UlMjBzZW5kZXIlMEFsZXQlMjBjb3VudGVyJTIwJTNEJTIwMCUzQiUwQWxldCUyMG1lc3NhZ2VzJTIwJTNEJTIwJTVCJTNCJTBBJTBBJTJGJTJGJTIwRnVuY3Rpb24lMjB0byUyMHVwZGF0ZSUyMHRoZSUyMGRpc3BsYXklMEFjb25zdCUyMHVwZGF0ZURpc3BsYXklMjAlM0QlMjAoKSUyMCUzRCUzRSUyMCU3QiUwQSUyMCUyMHJvb3QuaW5uZXJIVE1MJTIwJTNEJTIwJ0NvbnRpbnVvdXMlMjBNZXNzYWdlJTIwU2VuZGVyJTIwJTI4JTI0JTdCbWV0YWZyYW1lLmlkJTdEJTI5JTIwJTNBJTIwJTI0JTdCY291bnRlciU3RCUyMCUyOCUyNCU3QkRhdGUubm93KCklN0QlM0IlMEElN0QlM0IlMEElMEElMkYlMkYlMjBGdW5jdGlvbiUyMHRvJTIwc2VuZCUyMGElMjBtZXNzYWdlJTBBY29uc3QlMjBzZW5kTWVzc2FnZSUyMCUzRCUyMCgpJTIwJTNEJTNFJTIwJTdCJTBBJTIwJTIwY291bnRlciUyQiUyQiUzQiUwQSUyMCUyMGNvbnN0JTIwbWVzc2FnZSUyMCUzRCUyMCdNZXNzYWdlJTIwJTIzJTI0JTdCY291bnRlciU3RCUyMGZyb20lMjAlMjQlN0JtZXRhZnJhbWUuaWQlN0QlMjAlMjQlN0JEYXRlLm5vdygpJTdEJTIwJTNCJTBBJTIwJTIwJTBBJTIwJTIwJTJGJTJGJTIwU2VuZCUyMHRoZSUyMG1lc3NhZ2UlMjBhcyUyMGFuJTIwb3V0cHV0JTBBJTIwJTIwc2V0T3V0cHV0KCdtZXNzYWdlJyUyQyUyMG1lc3NhZ2UpJTNCJTBBJTIwJTIwJTBBJTIwJTIwJTJGJTJGJTIwVXBkYXRlJTIwdGhlJTIwZGlzcGxheSUwQSUyMCUyMHVwZGF0ZURpc3BsYXkoKSUzQiUwQSUyMCUyMCUwQSUyMCUyMCUyRiUyRiUyMEhhbmRsZSUyMGluY29taW5nJTIwbWVzc2FnZXMlMEFleHBvcnQlMjBjb25zdCUyMG9uSW5wdXRzJTIwJTNEJTIwKGlucHV0cyklMjAlM0QlM0UlMjAlN0IlMEElMjAlMjAlMkYlMkYlMjBDaGVjayUyMGlmJTIwd2UlMjByZWNlaXZlZCUyMGElMjBtZXNzYWdlJTIwaW5wdXQlMEElMjAlMjBpZiUyMChpbnB1dHMubWVzc2FnZSUyMCUyNiUyNiUyMG1lc3NhZ2VzLmxlbmd0aCUyMCUzQyUyMDEwMCklMjAlN0IlMEElMjAlMjAlMjAlMjBtZXNzYWdlcy5wdXNoKGlucHV0cy5tZXNzYWdlKSUzQiUwQSUyMCUyMCUyMCUyMHVwZGF0ZURpc3BsYXkoKSUzQiUwQSUyMCUyMCUyMCUyMGxvZyglNjBSZWNlaXZlZCUzQSUyMCUyNCU3QmlucHV0cy5tZXNzYWdlJTdEJTYwKSUzQiUwQSUyMCUyMCU3RCUwQSU3RCUzQiUwQSUwQSUyRiUyRiUyMEluaXRpYWxpemUlMjB0aGUlMjBkaXNwbGF5JTBBdXBkYXRlRGlzcGxheSgpJTNCJTBBJTBBJTJGJTJGJTIwU2V0JTIwdXAlMjB0aGUlMjBpbnRlcnZhbCUyMHRvJTIwc2VuZCUyMG1lc3NhZ2VzJTBBc2V0SW50ZXJ2YWwoc2VuZE1lc3NhZ2UlMkMlMjAxMDAwKSUzQiUwQA%3D%3D&modules=JTVCJTVE",
        "inputs": [
          {
            "source": "",
            "metaframe": "metapage2"
          }
        ]
      },
      "metapage2": {
        "url": "https://js.mtfm.io/#?editorWidth=80&js=JTJGJTJGJTIwQ29udGludW91cyUyMG1lc3NhZ2UlMjBzZW5kZXIlMEFsZXQlMjBjb3VudGVyJTIwJTNEJTIwMCUzQiUwQWxldCUyMG1lc3NhZ2VzJTIwJTNEJTIwJTVCJTNCJTBBJTBBJTJGJTJGJTIwRnVuY3Rpb24lMjB0byUyMHVwZGF0ZSUyMHRoZSUyMGRpc3BsYXklMEFjb25zdCUyMHVwZGF0ZURpc3BsYXklMjAlM0QlMjAoKSUyMCUzRCUzRSUyMCU3QiUwQSUyMCUyMHJvb3QuaW5uZXJIVE1MJTIwJTNEJTIwJ0NvbnRpbnVvdXMlMjBNZXNzYWdlJTIwU2VuZGVyJTIwJTI4JTI0JTdCbWV0YWZyYW1lLmlkJTdEJTI5JTIwJTNBJTIwJTI0JTdCY291bnRlciU3RCUyMCUyOCUyNCU3QkRhdGUubm93KCklN0QlM0IlMEElN0QlM0IlMEElMEElMkYlMkYlMjBGdW5jdGlvbiUyMHRvJTIwc2VuZCUyMGElMjBtZXNzYWdlJTBBY29uc3QlMjBzZW5kTWVzc2FnZSUyMCUzRCUyMCgpJTIwJTNEJTNFJTIwJTdCJTBBJTIwJTIwY291bnRlciUyQiUyQiUzQiUwQSUyMCUyMGNvbnN0JTIwbWVzc2FnZSUyMCUzRCUyMCdNZXNzYWdlJTIwJTIzJTI0JTdCY291bnRlciU3RCUyMGZyb20lMjAlMjQlN0JtZXRhZnJhbWUuaWQlN0QlMjAlMjQlN0JEYXRlLm5vdygpJTdEJTIwJTNCJTBBJTIwJTIwJTBBJTIwJTIwJTJGJTJGJTIwU2VuZCUyMHRoZSUyMG1lc3NhZ2UlMjBhcyUyMGFuJTIwb3V0cHV0JTBBJTIwJTIwc2V0T3V0cHV0KCdtZXNzYWdlJyUyQyUyMG1lc3NhZ2UpJTNCJTBBJTIwJTIwJTBBJTIwJTIwJTJGJTJGJTIwVXBkYXRlJTIwdGhlJTIwZGlzcGxheSUwQSUyMCUyMHVwZGF0ZURpc3BsYXkoKSUzQiUwQSUyMCUyMCUwQSUyMCUyMCUyRiUyRiUyMEhhbmRsZSUyMGluY29taW5nJTIwbWVzc2FnZXMlMEFleHBvcnQlMjBjb25zdCUyMG9uSW5wdXRzJTIwJTNEJTIwKGlucHV0cyklMjAlM0QlM0UlMjAlN0IlMEElMjAlMjAlMkYlMkYlMjBDaGVjayUyMGlmJTIwd2UlMjByZWNlaXZlZCUyMGElMjBtZXNzYWdlJTIwaW5wdXQlMEElMjAlMjBpZiUyMChpbnB1dHMubWVzc2FnZSUyMCUyNiUyNiUyMG1lc3NhZ2VzLmxlbmd0aCUyMCUzQyUyMDEwMCklMjAlN0IlMEElMjAlMjAlMjAlMjBtZXNzYWdlcy5wdXNoKGlucHV0cy5tZXNzYWdlKSUzQiUwQSUyMCUyMCUyMCUyMHVwZGF0ZURpc3BsYXkoKSUzQiUwQSUyMCUyMCUyMCUyMGxvZyglNjBSZWNlaXZlZCUzQSUyMCUyNCU3QmlucHV0cy5tZXNzYWdlJTdEJTYwKSUzQiUwQSUyMCUyMCU3RCUwQSU3RCUzQiUwQSUwQSUyRiUyRiUyMEluaXRpYWxpemUlMjB0aGUlMjBkaXNwbGF5JTBBdXBkYXRlRGlzcGxheSgpJTNCJTBBJTBBJTJGJTJGJTIwU2V0JTIwdXAlMjB0aGUlMjBpbnRlcnZhbCUyMHRvJTIwc2VuZCUyMG1lc3NhZ2VzJTBBc2V0SW50ZXJ2YWwoc2VuZE1lc3NhZ2UlMkMlMjAxMDAwKSUzQiUwQA%3D%3D&modules=JTVCJTVE",
        "inputs": [
          {
            "source": "",
            "metaframe": "metapage1"
          }
        ]
      }
    }
  }

const columnContainer = document.createElement("div");
columnContainer.style = "display: flex; flex-direction: column; width: 100%;";
document.getElementById("body").appendChild(columnContainer);


for (const count of [1, 2]) {
  const pageContainer = document.createElement("div");
  pageContainer.style = "display: flex; flex-direction: column; width: 100%;";
  const title1 = document.createElement("h3");
  title1.textContent = `Metapage ${count} concurrent`;
  pageContainer.appendChild(title1);
  columnContainer.appendChild(pageContainer);
  
  const row = document.createElement("div");
  row.style = "display: flex; flex-direction: row; gap: 10px; width: 500px; min-height: 300px;";
  pageContainer.appendChild(row);

  const metapageInstance = new Metapage(messagePassingMetapageDefinition);
  await metapageInstance.init();

  // row.appendChild(column1);
  // document.getElementById("body").appendChild(row);
  
  for (const metaframeId of metapageInstance.getMetaframeIds()) {
      const iframe = await metapageInstance.getMetaframe(metaframeId).iframe;
      iframe.style = "width: 100%; height: 300px;";
      row.appendChild(iframe);
  }
}
