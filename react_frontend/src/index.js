import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';



class Projects extends React.Component {
  constructor(props) {
    super(props);
  }

  render(){
    var project_array = []


    for (let [project, entries] of Object.entries(this.props.items)){
      console.log(entries)
      project_array += <Project name = {project} entries = {entries} />
    }

    return (
      project_array
    )
  }
}

class Project extends React.Component {
  constructor(props) {
    super(props);
  }

  render(){
    

    return (
      <h2> {this.props.project} </h2>
    )
  }
}




const [page_config, setConfig] = useState(0);

async function fetchData() {
const res = await fetch("./get_config");
res
  .json()
  .then(res => setConfig(res))
}

useEffect(() => {
fetchData();
});

ReactDOM.render(
  <React.StrictMode>
    
    <Projects items = {page_config} />

  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
