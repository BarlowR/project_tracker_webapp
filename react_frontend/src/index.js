import ReactDOM from 'react-dom';
import './index.css';
import {ProjectAdd, CheckpointAdd } from "./entry_popup.js";

import reportWebVitals from './reportWebVitals';
import React from 'react';



class Projects extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data : {},
            project_popup: false,
            checkpoint_popup: true
        };
        this.old_state = {};
        this.waiting_for_save = false;
        this.updates_to_data = false;
        this.fetching_config = true;

        this.checkpoint_temp = {proj:"", pos:0, operation : ""} //position
    }


    componentDidMount(){
        fetch("./get_config")
        //fetch("./get_template")
        .then(res => res.json())
        .then(json_data => {
            this.fetching_config = false;
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
                if (completed === "True"){
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
            config[project] = [];
            this.setStateSave(config);
            return true;
        }
    }

    alterCheckpoint(project, checkpoint_num, operation, title = null, details = null){

        let config = this.state.data
        let checkpoints = config[project];

        let new_checkpoint = {
                "name" : title,
                "dets" : details,
                "finished": false,
                "num": (checkpoint_num)
                };

        //shift all nums above and including current checkpoint up one and add new checkpoint in place of passed checkpoint
        if (operation === "add left"){
            for (let i = 0; i < checkpoints.length; i++){
                if (checkpoints[i].num >= checkpoint_num){
                    checkpoints[i].num += 1;
                }
            }
            checkpoints.push(new_checkpoint)
        }
        //shift all checkpoint nums above current checkpoint up one and add new checkpoint above current checkpoint
        if (operation === "add right"){
            for (let i = 0; i < checkpoints.length; i++){
                if (checkpoints[i].num <= checkpoint_num){
                    checkpoints[i].num -= 1;
                }
            }
            checkpoints.push(new_checkpoint)
        }
        if (operation === "delete"){
            for (let i = 0; i < checkpoints.length; i++){
                if (checkpoints[i].num === checkpoint_num){
                    checkpoints.splice(i, 1);
                }
            }
        }

        config[project] = checkpoints;
        this.setStateSave(config);
    }

    tempCheckpointDetails(project, checkpoint_num, operation){
        this.checkpoint_temp.proj = project;
        this.checkpoint_temp.pos = checkpoint_num;
        this.checkpoint_temp.operation = operation;
        this.setState({checkpoint_popup:true});
    }

    newCheckpoint(title, details){
        this.alterCheckpoint(this.checkpoint_temp.proj, this.checkpoint_temp.pos, this.checkpoint_temp.operation, title, details)
    }

    projectPopup(show){
        if (show){
            this.setState({project_popup: true})
        }
        else {
            this.setState({project_popup: false})
        }
    }

    checkpointPopup(show){
        if (show){
            this.setState({checkpoint_popup: true})
        }
        else {
            this.setState({checkpoint_popup: false})
        }
    }


    render(){
        let projects = [];

        for (const [p_name, p_data] of Object.entries(this.state.data)){
            projects.push([p_name, p_data])
        }
        let project_elements = [];

        if (projects.length > 0){
            project_elements = projects.map((p, i) =>
              <Project 
              project_name = {p[0]} 
              project_data = {p[1]} 
              key = {i} 
              setFinished = {(proj, num) => this.setFinished(proj, num)}
              alterProject = {(project, operation) => this.alterProject(project, operation)}
              newCheckpoint = {(project, checkpoint_num, operation) => this.tempCheckpointDetails(project, checkpoint_num, operation)}
              deleteCheckpoint = {(project, checkpoint_num) => this.alterCheckpoint(project, checkpoint_num, "delete")}
              />
              );
        }

        console.log(this.fetching_config);
        if (this.fetching_config){
            project_elements.push(
                <div className = "loading"> Loading ... </div>
                )
        }
        else {
            project_elements.push(
                <button 
                className = "add_project"
                onClick = {() => this.setState({project_popup: true})}>
                    Add Project
                </button>
            )
        }

        if (this.state.project_popup){
            project_elements.push(
                <ProjectAdd 
                alterProject = {(proj, op) => this.alterProject(proj, op)}
                projectPopup = {(show) => this.projectPopup(show)}
                />
            );
        }

        if (this.state.checkpoint_popup){
            project_elements.push(
                <CheckpointAdd 
                newCheckpoint = {(proj, op) => this.newCheckpoint(proj, op)}
                checkpointPopup = {(show) => this.checkpointPopup(show)}
                />
            );
        }

        return (project_elements)
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
        let checkpoint_elements =[];
        

        if (checkpoints.length > 0){
            checkpoints.sort((a,b) => (a.num > b.num) ? 1 : -1);

            checkpoint_elements = checkpoints.map((d, i) =>
                <Checkpoint 
                  data = {d} 
                  active = {this.state.active} 
                  checkpoint_num = {checkpoints.length}
                  key = {i*2} 
                  setActive={() => this.setActive(d.num)}
                  setFinished = {() => this.props.setFinished(this.props.project_name, d.num)}
                  Remove = {() => this.props.deleteCheckpoint(this.props.project_name, d.num)}
                  Add = {(lr) => lr ? 
                    this.props.newCheckpoint(this.props.project_name, d.num, "add right") :
                    this.props.newCheckpoint(this.props.project_name, d.num, "add left")}
                />
                );
        }
        else {
            checkpoint_elements = 
                <button 
                className = "add_checkpoint"
                onClick = {() => this.props.newCheckpoint(this.props.project_name, 0, "add left")}>
                    Add Checkpoint
                </button>
        }

        



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
    let details = props.data.dets
    let num = props.data.num
    let finished = props.data.finished
    let finished_class = finished ? "finished" : ""

    let display; 
    if (props.active === num){

        display =
        <div className = {"checkpoint active " +finished_class} onClick={() => props.setActive()}>
            <div className = "name"> {name} </div>
            <div className = "details"> {details} </div>
            <button onClick={() => props.setFinished()} > {finished ? "uncheck" : "check"} </button>
            <PrevDeleteNext 
                key = "pdn"
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
