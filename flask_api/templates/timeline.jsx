
import React from 'react';
import ReactDOM from 'react-dom';

'use strict';

var project1 = {
    "project1": {
        "checkpoints": [
            {"name" : "Placeholder Name 1", 
            "desc" : "askdlaskjdljasdja;sd\njaskldjas",
            "num" : 1, 
            "date" : "Nov 12th"},

            {"name" : "Placeholder Name 2", 
            "desc" : "askdlaskjdljasdja;sd\njaskldjas",
            "num" : 2, 
            "date" : "Nov 12th"},
            
            {"name" : "Placeholder Name 3", 
            "desc" : "askdlaskjdljasdja;sd\njaskldjas",
            "num" : 3, 
            "date" : "Nov 12th"},
            
            {"name" : "Placeholder Name 5", 
            "desc" : "askdlaskjdljasdja;sd\njaskldjas",
            "num" : 5, 
            "date" : "Nov 12th"},
            
            {"name" : "Placeholder Name 4", 
            "desc" : "askdlaskjdljasdja;sd\njaskldjas",
            "num" : 4, 
            "date" : "Nov 12th"}
        ],
        "current_position": 3
    }};



const Greeting = ({name}) => {
  return <text>hello {name}</text>;
}
 

const Main = () => {
  return (
    <svg>
      <g transform="translate(20,20)">
        <Greeting name="Maciek" />
      </g>
    </svg>
  )
}

class Timeline extends React.Component {
  render() {
    return (
      <Main />
    );
  }
}


ReactDOM.render(
  <Timeline />,
  document.getElementById('projectbody')
);