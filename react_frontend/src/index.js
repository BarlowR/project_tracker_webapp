import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import React from 'react';



class Projects extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          data : {}
      }
    }


    componentDidMount(){
        //fetch("./get_config")
        fetch("./get_template")
        .then(res => res.json())
        .then(json_data => this.setState({... this.state, data: json_data}))
        
    }

    saveConfigToServer(data){
        fetch('./save_config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    }


    setFinished(project, checkpoint_num){
        console.log("setFinished called with " + project + " on checkpoint num " + checkpoint_num);
        for (let i = 0; i < this.state.data[project].length; i++){

            if (this.state.data[project][i].num == checkpoint_num){

                let config = this.state.data

                config[project][i].finished = !config[project][i].finished
                this.setState(config);

                //TODO: don't call this here, it should only be called once when the user leaves the page 
                this.saveConfigToServer(config);

                
                break;
            }
        }
    }

    alterProject(project = "none", operation){
        console.log("alterProject called with " + operation + " on " + project);

        //remove project
        if (operation == "delete" && project != "none"){
            let config = this.state.data;
            delete config[project];
            this.setState(config);
            return true;
        }

        // add project TODO: form entry
        if (operation == "add"){
            let config = this.state.data;
            config[project] = [{
            "date": "N/A",
            "desc" : "placeholder",
            "finished": false,
            "name": "newProjCkpt",
            "num": 1
            }];
            this.setState(config);
            return true;
        }
    }

    alterCheckpoint(project, checkpoint_num, operation){

        let config = this.state.data
        let checkpoints = config[project];

        //shift all nums above and including current checkpoint up one and add new checkpoint in place of passed checkpoint
        if (operation == "add left"){
            for (let i = 0; i < checkpoints.length; i++){
                if (checkpoints[i].num >= checkpoint_num){
                    checkpoints[i].num ++;
                }
            }
            checkpoints.push({
                "date": "N/A",
                "desc" : "placeholder",
                "finished": false,
                "name": "newProjCkpt",
                "num": (checkpoint_num)
                })
        }
        //shift all checkpoint nums above current checkpoint up one and add new checkpoint above current checkpoint
        if (operation == "add right"){
            for (let i = 0; i < checkpoints.length; i++){
                if (checkpoints[i].num > checkpoint_num){
                    checkpoints[i].num ++;
                }
            }
            checkpoints.push({
                "date": "N/A",
                "desc" : "placeholder",
                "finished": false,
                "name": "newProjCkpt",
                "num": (checkpoint_num + 1)
                })
        }
        if (operation == "delete"){
            delete checkpoint[checkpoint_num];
        }






            
        }
    }


    render(){
        let projects = [];

        for (const [p_name, p_data] of Object.entries(this.state.data)){
            projects.push([p_name, p_data])
        }

        const project_elements = projects.map((p, i) =>
          <Project 
          project_name = {p[0]} 
          project_data = {p[1]} 
          key = {i} 
          setFinished = {(proj, num) => this.setFinished(proj, num)}
          />
          );


        return (
          project_elements
          )
    }
}







class Project extends React.Component {
  constructor(props) {
    super(props);
    
    this.checkpoints = this.props.project_data;
    this.checkpoints.sort((a, b) => (a.num > b.num) ? 1 : -1);

    //set our active checkpoint as the last consecutively finished element
    let last_finished = 0;
    for (let checkpoint of this.checkpoints){
        if (!checkpoint.finished){
            last_finished = checkpoint.num
            break;
        }
    } 
    this.state = {active: last_finished}
    console.log(this.state.active);

    }

    componentDidMount(){
    }

    setActive(num){
        //console.log(num);
        this.setState({active : num});
    }

    render(){

        const checkpoint_elements = this.checkpoints.map((d, i) =>
          <Checkpoint 
          data = {d} 
          active = {this.state.active} 
          checkpoint_num = {this.checkpoints.length}
          key = {i*2} 
          setActive={() => this.setActive(d.num)}
          setFinished = {() => this.props.setFinished(this.props.project_name, d.num)}
          />
          );

        return (
            <div className = "project_element">
            <div className = "project_title"> {this.props.project_name} </div>
            <div className = "checkpoint_timeline"> {checkpoint_elements} </div>
            <RemoveProj />
            </div>
            )
    }
}








class Checkpoint extends React.Component {
  constructor(props) {
    super(props);
    }

    render(){

        let name = this.props.data.name;
        let description = this.props.data.desc
        let date = this.props.data.date
        let num = this.props.data.num
        let finished = this.props.data.finished
        let finished_class = finished ? "finished" : ""

        let display; 
        if (this.props.active == num){

            display =
            <div className = {"checkpoint active " +finished_class} onClick={() => this.props.setActive()}>
            <div className = "name"> {name} </div>
            <div className = "description"> {description} </div>
            <div className = "date"> {date} </div>
            <button onClick={() => this.props.setFinished()} > {finished ? "uncheck" : "check"} </button>
            <PrevDeleteNext 
            Add = {(lr) => this.Add(lr)}
            Delete = {() => this.Delete()}
            />
            </div>
        }
        else{
            display =
            <div className = {"checkpoint " + finished_class} onClick={() => this.props.setActive()}>
            {this.props.data.name}
            </div>
        }
        return(
            <div style = {{width : (100/this.props.checkpoint_num + '%'), float: "left"}}>
            {display}
            </div>
            )
    }
}



function RemoveProj(props){
    return(
        <button 
        className = "remove_project"
        onClick={() => this.props.Remove()} > Remove Project </button>
        )
}



function PrevDeleteNext(props){
    return(
        <div className = "prev_delete_next">
        
        <button
        style = {{width : '33%'}}
        className = "add_before"
        onClick={() => this.props.Add(-1)} > add before </button>

        <button
        style = {{width : '33%'}}
        className = "delete"
        onClick={() => this.props.Delete()} > delete </button>

        <button
        style = {{width : '33%'}}
        className = "add_before"
        onClick={() => this.props.Add(1)} > add after </button>

        </div>
        )
}



ReactDOM.render(
  <React.StrictMode>

  <Projects />

  </React.StrictMode>,
  document.getElementById('root')
  );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
