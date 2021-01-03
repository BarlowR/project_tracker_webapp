import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import React from 'react';



class Projects extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data : {}
        };
        this.old_state = {};
        this.waiting_for_save = false;
        this.updates_to_data = false;
    }


    componentDidMount(){
        fetch("./get_config")
        //fetch("./get_template")
        .then(res => res.json())
        .then(json_data => {
            this.setState({...this.state, data: json_data});
            this.saveConfigTimer()
            console.log("mounted");
            
            return ("done");
        });
    }

    setStateSave(data){
        this.updates_to_data = true;
        this.setState(data)
    }

    saveConfigToServer(data){
        //console.log(this.updates_to_data)
        
        if (!this.waiting_for_save && this.updates_to_data){
            this.waiting_for_save = true;
            this.updates_to_data = false;

            fetch('./save_config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)})
            .then(res => res.text())
            .then(completed => {
                if (completed == "True"){
                    console.log("successfully saved to GDrive");
                }
                else {
                    console.log("error saving to GDrive");
                    this.updates_to_data = true;
                }
                this.waiting_for_save = false;
                return ("done")
            })
        }
    }

    saveConfigTimer(){
        setInterval(() => this.saveConfigToServer(this.state.data), 5000);   
    }


    setFinished(project, checkpoint_num){
        console.log("setFinished called with " + project + " on checkpoint num " + checkpoint_num);
        for (let i = 0; i < this.state.data[project].length; i++){

            if (this.state.data[project][i].num === checkpoint_num){

                let config = this.state.data

                config[project][i].finished = !config[project][i].finished
                this.setStateSave(config);
                              
                break;
            }
        }
    }

    alterProject(project = "none", operation){
        console.log("alterProject called with " + operation + " on " + project);

        //remove project
        if (operation === "delete" && project !== "none"){
            let config = this.state.data;
            delete config[project];
            this.setStateSave(config);
            return true;
        }

        // add project      TODO: form entry
        if (operation === "add"){
            let config = this.state.data;
            config[project] = [{
            "date": "N/A",
            "desc" : "placeholder",
            "finished": false,
            "name": "newProjCkpt",
            "num": 1
            }];
            this.setStateSave(config);
            return true;
        }
    }

    alterCheckpoint(project, checkpoint_num, operation){

        let config = this.state.data
        let checkpoints = config[project];

        //shift all nums above and including current checkpoint up one and add new checkpoint in place of passed checkpoint
        if (operation === "add left"){
            for (let i = 0; i < checkpoints.length; i++){
                if (checkpoints[i].num >= checkpoint_num){
                    checkpoints[i].num ++;
                }
            }
            checkpoints.push({
                "date": "N/A",
                "desc" : "placeholder " + checkpoint_num,
                "finished": false,
                "name": "newProjCkpt",
                "num": (checkpoint_num)
                })
        }
        //shift all checkpoint nums above current checkpoint up one and add new checkpoint above current checkpoint
        if (operation === "add right"){
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
        if (operation === "delete"){
            for (let i = 0; i < checkpoints.length; i++){
                if (checkpoints[i].num === checkpoint_num){
                    checkpoints.splice(i, 1);
                }
            }
        }

        config[project] = checkpoints;
        console.log(config)
        console.log(this.setStateSave(config));
        
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
          alterProject = {(project, operation) => this.alterProject(project, operation)}
          alterCheckpoint = {(project, checkpoint_num, operation) => this.alterCheckpoint(project, checkpoint_num, operation)}
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

        //set our active checkpoint as the last consecutively finished element
        let last_finished = 0;
        for (let checkpoint of this.props.project_data){
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

        let checkpoints = this.props.project_data;
        checkpoints.sort((a,b) => (a.num > b.num) ? 1 : -1);

        const checkpoint_elements = checkpoints.map((d, i) =>
          <Checkpoint 
              data = {d} 
              active = {this.state.active} 
              checkpoint_num = {checkpoints.length}
              key = {i*2} 
              setActive={() => this.setActive(d.num)}
              setFinished = {() => this.props.setFinished(this.props.project_name, d.num)}
              Remove = {() => this.props.alterCheckpoint(this.props.project_name, d.num, "delete")}
              Add = {(lr) => lr ? 
                this.props.alterCheckpoint(this.props.project_name, d.num, "add right") :
                this.props.alterCheckpoint(this.props.project_name, d.num, "add left")}
          />
          );

        return (
            <div className = "project_element">
                <div className = "project_title"> {this.props.project_name} </div>
                <div className = "checkpoint_timeline"> {checkpoint_elements} </div>
                <RemoveProj 
                Remove = {() => this.props.alterProject(this.props.project_name, "delete")}
                />
            </div>
        )
    }
}








function Checkpoint(props){
    
    let name = props.data.name;
    let description = props.data.desc
    let date = props.data.date
    let num = props.data.num
    let finished = props.data.finished
    let finished_class = finished ? "finished" : ""

    let display; 
    if (props.active === num){

        display =
        <div className = {"checkpoint active " +finished_class} onClick={() => props.setActive()}>
        <div className = "name"> {name} </div>
        <div className = "description"> {description} </div>
        <div className = "date"> {num} </div>
        <button onClick={() => props.setFinished()} > {finished ? "uncheck" : "check"} </button>
        <PrevDeleteNext 
            Add = {(lr) => props.Add(lr)}
            Delete = {() => props.Remove()}
        />
        </div>
    }
    else{
        display =
        <div className = {"checkpoint " + finished_class} onClick={() => props.setActive()}>
        {props.data.name}
        </div>
    }
    return(
        <div style = {{width : (100/props.checkpoint_num + '%'), float: "left"}}>
        {display}
        </div>
        )
    
}



function RemoveProj(props){
    return(
        <button 
        className = "remove_project"
        onClick={() => props.Remove()} > Remove Project </button>
        )
}



function PrevDeleteNext(props){
    return(
        <div className = "prev_delete_next">
        
        <button
        style = {{width : '33%'}}
        className = "add_before"
        onClick={() => props.Add(0)} > add before </button>

        <button
        style = {{width : '33%'}}
        className = "delete"
        onClick={() => props.Delete()} > delete </button>

        <button
        style = {{width : '33%'}}
        className = "add_before"
        onClick={() => props.Add(1)} > add after </button>

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
