import './projects.css';
import {ProjectAdd, CheckpointAdd } from "./popup.js";
import React from 'react';
import Linkify from 'react-linkify';



export default class Projects extends React.Component {
    //top level element for the webapp
    constructor(props) {
        super(props);
        this.state = {
            data : {},
            project_popup: false,
            checkpoint_popup: false
        };

        //API call variables
        this.waiting_for_save = false;
        this.updates_to_data = false;
        this.fetching_config = true;

        //temp storage for checkpoint add handling
        this.checkpoint_temp = {proj:"", pos:0, operation : ""} //position
    }


    componentDidMount(){
        //once the element is loaded, fetch the config file from the api server
        fetch("./get_config")
        //fetch("./get_template")
        .then(res => res.json())
        .then(json_data => {
            //once we have the config file loaded in, set our state to use the fetched data and start the save timer
            this.fetching_config = false;
            this.setState({...this.state, data: json_data});
            this.saveConfigTimer()
            return null;
        });
    }

    setStateSave(data){
        //call this instead of setState when we need to save the state to the google drive file
        this.updates_to_data = true;
        this.setState(data)
    }

    saveConfigTimer(){
        //start a timer that calls the saveConfigToServer method every 5 seconds
        setInterval(() => this.saveConfigToServer(this.state.data), 5000);   
    }

    saveConfigToServer(data){
        //if we haven't already started a /save_config POST and we have new updates to the page config, make a /save_config POST       
        
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

    


    setFinished(project, checkpoint_num){
        // toggle the state of a checkpoint between finished and not finished
        for (let i = 0; i < this.state.data[project].length; i++){

            if (this.state.data[project][i].num === checkpoint_num){
                let config = this.state.data;
                config[project][i].finished = !config[project][i].finished;
                this.setStateSave(config);
                break;
            }
        }
    }

    alterProject(project = "none", operation){
        //apply the given operation to the given project 

        //remove project
        if (operation === "delete" && project !== "none"){
            let config = this.state.data;
            delete config[project];
            this.setStateSave(config);
            return true;
        }

        // add project
        if (operation === "add"){
            let config = this.state.data;
            config[project] = [];
            this.setStateSave(config);
            return true;
        }
    }

    alterCheckpoint(project, checkpoint_num, operation, title = null, details = null){
        //apply the given operation to the given checkpoint_num within the given project

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
        //shift all checkpoint nums below and including current checkpoint down one and add new checkpoint in place of current checkpoint
        if (operation === "add right"){
            for (let i = 0; i < checkpoints.length; i++){
                if (checkpoints[i].num <= checkpoint_num){
                    checkpoints[i].num -= 1;
                }
            }
            checkpoints.push(new_checkpoint)
        }
        //delete the checkpoint
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
        //initiate the creation of a new checkpoint with the given project, number and operation (add left or arr right). 
        //the checkpoint popup will be displayed, but the creation of the new checkpoint won't go through if the user cancels the popup.
        //the project/number/operation are cached so that they don't need to be passed to the checkpoint popup.
        this.checkpoint_temp.proj = project;
        this.checkpoint_temp.pos = checkpoint_num;
        this.checkpoint_temp.operation = operation;
        this.setState({checkpoint_popup:true});
    }

    newCheckpoint(title, details){
        //create a new checkpoint using the given title and details, and the cached project, number and operation. 
        //this is passed down to the checkpoint popup
        this.alterCheckpoint(this.checkpoint_temp.proj, this.checkpoint_temp.pos, this.checkpoint_temp.operation, title, details)
    }

    projectPopup(show){
        //function to show or hide the project popup
        if (show){
            this.setState({project_popup: true})
        }
        else {
            this.setState({project_popup: false})
        }
    }

    checkpointPopup(show){
        //function to show or hide the checkpoint popup
        if (show){
            this.setState({checkpoint_popup: true})
        }
        else {
            this.setState({checkpoint_popup: false})
        }
    }


    render(){

        //iterate through the entries of projects in the component's state and save the keys and values as elements in a new array
        let projects = [];
        for (const [p_name, p_data] of Object.entries(this.state.data)){
            projects.push([p_name, p_data])
        }

        //map the project component onto the previously defined array
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

        //display either "loading" or an add project button based on whether we've loaded the config file yet.
        //if we're still getting the config file from the drive service, we don't want users adding projects.
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
                    +
                </button>
            )
        }

        //include the add project popup based on the state variable
        if (this.state.project_popup){
            project_elements.push(
                <ProjectAdd 
                alterProject = {(proj, op) => this.alterProject(proj, op)}
                projectPopup = {(show) => this.projectPopup(show)}
                />
            );
        }

        //include the add checkpoint popup based on the state variable
        if (this.state.checkpoint_popup){
            project_elements.push(
                <CheckpointAdd 
                newCheckpoint = {(proj, op) => this.newCheckpoint(proj, op)}
                checkpointPopup = {(show) => this.checkpointPopup(show)}
                />
            );
        }

        //return the list of elements to be rendered
        return (
            <div id = "projects_body">
                {project_elements}
            </div>)
    }
}







class Project extends React.Component {
    /*an individual project component. requires the following as passed props:
    project_name
    project_data
    key
    setFinished = {(proj, num) =>  }
    alterProject = {(project, operation) =>  }
    newCheckpoint = {(project, checkpoint_num, operation) =>  }
    deleteCheckpoint = {(project, checkpoint_num) =>   }
    */

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
    }

    setActive(num){
        //set the given checkpoint number as active
        this.setState({active : num});
    }

    render(){

        //if our list of checkpoints has any elements, sort the elements by number property and then map the checkpoint component to the sorted array
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
        // otherwise, display an "add checkpoint" button
        else {
            checkpoint_elements = 
                <button 
                className = "add_checkpoint"
                onClick = {() => this.props.newCheckpoint(this.props.project_name, 0, "add left")}>
                    Add Checkpoint
                </button>
        }


        //render the project title, the list of checkpoints and a remove project button
        return (
            <div className = "project_element">
                <div className = "project_title"> 
                    {this.props.project_name} 
                    <RemoveProj 
                    Remove = {() => this.props.alterProject(this.props.project_name, "delete")}
                    />
                </div>

                <div className = "checkpoint_timeline"> {checkpoint_elements} </div>
                
            </div>
        )
    }
}






function Checkpoint(props){
    /*an individual checkpoint component. Display switches bweteen active and finished states.
    requires the following as passed props:
    data = {d} 
    active
    checkpoint_num 
    key
    setActive={() => }
    setFinished = {() => }
    Remove = {() => }
    Add = {(lr) => lr ? __ : __ }

    Note: a finished checkpoint will have a "finished" className in its div element
    */
    
    let name = props.data.name;
    let details = props.data.dets
    let num = props.data.num
    let finished = props.data.finished
    let finished_class = finished ? "finished" : ""


    // if currently active property is the same as the checkpoint's number, display the checkpoint with all of 
    // its details and an add left, delete and add right button
    let display; 
    if (props.active === num){

        display =
        <div className = {"checkpoint active " +finished_class} onClick={() => props.setActive()}>
            <div className = "name"> {name} </div>
            <div className = "details"> <Linkify> {details} </Linkify> </div>
            <button onClick={() => props.setFinished()} > {finished ? "uncheck" : "check"} </button>
            <PrevDeleteNext 
                key = "pdn"
                Add = {(lr) => props.Add(lr)}
                Delete = {() => props.Remove()}
            />
        </div>
    }
    //otherwise, just display the checkpoint name
    else{
        display =
        <div className = {"checkpoint " + finished_class} onClick={() => props.setActive()}>
        {props.data.name}
        </div>
    }
    return(
        <div className = {"checkpoint_container " + ((props.active === num) ? "active" : "")} >
        {display}
        </div>
        )
    
}



function RemoveProj(props){
    // just a remove project button
    return(
        <button 
        className = "remove_project"
        onClick={() => props.Remove()} > - </button>
        )
}



function PrevDeleteNext(props){
    // a trio of buttons to add left, remove or add right checkpoints
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




//TODO : report web analytics
//reportWebVitals();
