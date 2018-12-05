import React, { Component } from 'react';
import starPic from './img/star.png';
import halfPic from './img/half.png';
import hard from './img/black.png';
import medium from './img/blue.png';
import easy from './img/green.png';
import placeHolder from './img/hiker-mini.jpg';
import './HikeInfo.scss';
import firebase from 'firebase/app';
import Moment from 'react-moment';
import './SignUpForm.scss';
import { HikeCard } from './Results';

export class TrailInfo extends Component {

    constructor(props) {
        super(props);
        this.state = { trail: undefined, comments: undefined };
    }

    componentDidMount() {

        let url = "https://www.hikingproject.com/data/get-trails-by-id?ids=" + this.props.match.params.hikeId + "&key=200378416-92e9bd6c5dd48e7dfa8c0a563189c165";

        let promise = fetch(url);

        promise.then((response) => {
            return response.json();
        })
            .then((data) => {
                console.log("here", data);
                let hike = data.trails[0];

                this.setState({ hike: hike });

            })
            .catch(function () {
            });


        // if user is signed in or not
        this.authUnRegFunc = firebase.auth().onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) { //signed in!
                this.setState({ user: firebaseUser });
            } else { //signed out
                this.setState({ user: null });
            }
        });

        // store the hike as the state, as well as hike comments
        this.commentRef = firebase.database().ref('hikes/' + this.props.match.params.hikeId);
        this.commentRef.on('value', (snapshot) => {
            let val = snapshot.val();
            let commentsArray = undefined;
            if (val) {
                let commentKeys = Object.keys(val);
                commentsArray = commentKeys.map((key) => {
                    let obj = val[key];
                    obj.id = key;
                    return obj;
                })
                commentsArray = commentsArray.sort((a, b) => {
                    return b.time - a.time;
                })
            }
            this.setState({
                comments: commentsArray
            });
        });

    }

    componentWillUnmount() {
        this.commentRef.off();
    }

    handleEdit = (editedReview, hikeHash, oldText) => {
        let url = 'hikes/' + this.props.match.params.hikeId + '/' + hikeHash
        let hikeReviewRef = firebase.database().ref(url);
        let newUserComment = {
            text: editedReview,
            edited: true
        }
        hikeReviewRef.update(newUserComment);

        // update the user
        // have to go through to find the matching comment because of the way
        // firebase database was set up
        // a little hackey..
        let hash = undefined;
        url = 'users/' + this.state.user.uid + '/userReviews/' + this.props.match.params.hikeId;
        let userReviewRef = firebase.database().ref(url);
        userReviewRef.on('value', (snapshot) => {
            let val = snapshot.val();
            if (val) {
                let hashKeys = Object.keys(val);
                for (let i = 0; i < hashKeys.length; i++) {
                    let data = val[hashKeys[i]];
                    console.log(data.text + " " + oldText);
                    if (data.text === oldText) {
                        console.log("found it")
                        hash = hashKeys[i];
                        i = hashKeys.length //exit loop
                    }
                }
            }
        });
        if (hash) {
            url = 'users/' + this.state.user.uid + '/userReviews/' + this.props.match.params.hikeId + '/' + hash;
            userReviewRef = firebase.database().ref(url);
            userReviewRef.update(newUserComment);
        }
    }

    handleReview = (userReview) => {
        let time = firebase.database.ServerValue.TIMESTAMP;

        // update firebase database
        let newComment = {
            text: userReview,
            time: time,
            user: this.state.user.uid,
            userName: this.state.user.displayName,
            userPhoto: this.state.user.photoURL
        }
        this.commentRef.push(newComment);

        // update user's review list
        this.userReviewRef = firebase.database().ref('users/' + this.state.user.uid + '/userReviews/'
            + this.props.match.params.hikeId);
        let newUserComment = {
            displayName: this.state.hike.name,
            text: userReview,
            time: time
        }
        this.userReviewRef.push(newUserComment);
    }


    render() {

        if (!this.state.hike) {
            return (<h2>No information available on this trail</h2>)
        } else {
            return (
                <div>
                    <div>
                        <HikeCard hike={this.state.hike} />
                    </div>
                    <CommentBox user={this.state.user} handleReview={this.handleReview}></CommentBox>
                    <HikeCommentList comments={this.state.comments} handleEdit={this.handleEdit}></HikeCommentList>
                    
                    {/* quick fix do footer doesn't cover */}
                    <div className="hidden">
                        <div className="card-body">
                        <h5 className="card-title">bufferrrrrrrrrrr</h5>
                        </div>
                    </div>
                </div>
            );
        }

    }
}

// Expected props
//   user = the firebase user object
//   handleReview = function to update reviews on firebase
class CommentBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            review: ''
        }
    }

    handleReview = (event) => {
        event.preventDefault();
        // alert if user didn't write anything
        if (this.state.review) {
            this.props.handleReview(this.state.review);
            this.setState({ review: '' })
        } else {
            this.setState({
                errorMessage: "You must write something first!"
            })
        }
    }

    handleChange = (event) => {
        event.preventDefault();
        let value = event.target.value;
        this.setState({
            review: value
        });
    }

    render() {
        if (!this.props.user) {
            return <h2><a href="#/Account">Sign in</a> to leave reviews</h2>
        };

        return (
            <div className="col justify-content-center">
                <h2>User Reviews</h2>
                {this.state.errorMessage &&
                    <div className="alert alert-danger">{this.state.errorMessage}</div>
                }
                <form className="justify-content-center">
                    <textarea className="my-form-control" name="reivew" value={this.state.review} placeholder="Add a review..." onChange={this.handleChange}></textarea>
                    <div className="">
                        <button className="btn btn-primary" onClick={this.handleReview}>Submit</button>
                    </div>
                </form>
            </div>
        );
    }
}

// Expected props:
//   comments: the firebase object for comments
class HikeCommentList extends Component {
    render() {
        if (!this.props.comments) return null;
        let renderedComments = this.props.comments.map((item, index) => {
            return <HikeComment key={index} comment={item} handleEdit={this.props.handleEdit}></HikeComment>
        });
        return (
            <div className="col left">
                {renderedComments}
            </div>
        );
    }
}

// expected props:
//   comment - comment object
class HikeComment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: false,
            newReview: ''
        }
    }

    handleEdit = () => {
        this.setState({editing:!this.state.editing})
    }

    handleDone = () => {
        this.setState({editing:!this.state.editing})
        if (this.state.newReview !== this.props.comment.text) {
            this.props.handleEdit(this.state.newReview, this.props.comment.id, this.props.comment.text);
        }
    }

    handleChange = (event) => {
        this.setState({newReview:event.target.value})
    }

    render() {
        let comment = this.props.comment;
        let time = 
            <h6 className="card-subtitle mb-2 text-muted">
                <Moment date={comment.time} fromNow></Moment>
            </h6>
        if (comment.edited) {
            time = 
                <h6 className="card-subtitle mb-2 text-muted">
                    <Moment date={comment.time} fromNow></Moment> (edited)
                </h6>
        }
        if (this.state.editing) {
            return (
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">
                            <img className="avatar" src={comment.userPhoto} alt={comment.userName} />
                            {comment.userName}
                            <button className="btn btn-success float-right" onClick={this.handleDone}>Edit</button>
                            <button className="btn btn-fail float-right" onClick={this.handleEdit}>Cancel</button>
                        </h5>
                        <textarea className="my-form-control" name="review" onChange={this.handleChange}>{comment.text}</textarea>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">
                            <img className="avatar" src={comment.userPhoto} alt={comment.userName} />
                            {comment.userName}
                            <button className="btn btn-dark float-right" onClick={this.handleEdit}>Edit</button>
                        </h5>
                        {time}
                        <p className="card-text">{comment.text}</p>
                    </div>
                </div>
            );
        }
    }
}