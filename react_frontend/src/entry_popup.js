import React from "react";
import "./popup.css"

class Popup extends React.Component {
    constructor(props) {
        super(props);
    }

    body() {
        return null;
    }
    save(){
        return null;
    }
    discard(){
        return null;
    }
    render() {
        return(
        <div className = "shadow">
            <div className = "popup_body">
                {this.body()}
                <button className = "popup_save" onClick = {() => this.save()}> Save </button>
                <button className = "popup_close" onClick = {() => this.discard()}> Discard </button>
            </div>
        </div>)
                
    }
}

export class ProjectAdd extends Popup {
    constructor(props) {
        super(props);
        this.state = {project_title: ""};
    }

    save(){
        if (this.state.project_title){
            this.props.alterProject(this.state.project_title, "add");
            this.setState({
              project_title: ""
            });
            this.props.projectPopup(false);
        }
        else{
            alert("Please enter a title before saving");
        }

    }

    discard(){
        this.setState({
          project_title: ""
        });
        this.props.projectPopup(false);
    }

    updateProjectTitle(evt) {
        this.setState({
          project_title: evt.target.value
        });
    }

    body() {
        return (
            <div className = "project_form">
                <input 
                value = {this.state.project_title}
                type="text" 
                name="project_title" 
                placeholder="Enter Project Title Here"
                onKeyDown={(e) => {
                    if (e.key === "Enter") this.save()
                    return null}}
                onChange={evt => this.updateProjectTitle(evt)}>
                </input>
            </div>
        );
    }
}




export class CheckpointAdd extends Popup {

    constructor(props) {
        super(props);
        this.state = {
            checkpoint_title: "",
            checkpoint_details: ""
        };
    }

    save(){
        if (this.state.checkpoint_title){
            this.props.newCheckpoint(this.state.checkpoint_title, this.state.checkpoint_details)
            this.setState({
                checkpoint_title: "",
                checkpoint_details: ""
            });
            this.props.checkpointPopup(false);
        }
        else {
            alert("Please enter a checkpoint title before saving");
        }
    }

    discard(){
        this.setState({
            checkpoint_title: "",
            checkpoint_details: ""
        });
        this.props.checkpointPopup(false);
    }

    updateCheckpointTitle(evt) {
        this.setState({
          checkpoint_title: evt.target.value
        });
    }

    updateCheckpointDetails(evt) {
        this.setState({
          checkpoint_details: evt.target.value
        });
    }


  body() {
        return (
            <div className = "checkpoint_form">
                <input 
                value = {this.state.checkpoint_title}
                type="text" 
                name="checkpoint_title" 
                placeholder="Enter Checkpoint Title"
                onChange={evt => this.updateCheckpointTitle(evt)}>
                </input>

                <textarea 
                value = {this.state.checkpoint_details}
                type="text" 
                name="checkpoint_details" 
                placeholder="Enter Checkpoint Details"
                onKeyDown={(e) => {
                    if (e.key === "Enter") this.save()
                    return null}}
                onChange={evt => this.updateCheckpointDetails(evt)}>
                </textarea>

               
            </div>
        );
    }
}


