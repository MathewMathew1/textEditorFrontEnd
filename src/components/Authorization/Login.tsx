import React, { useEffect, useState } from "react";
import "./Authorization.css";
import { Link, useSearchParams } from "react-router-dom";
import { emailLoginRoute, googleSignUpRoute, usernameLoginRoute } from "../../routes";

const LENGTH = {
  MINIMUM_PASSWORD: 8,
  MINIMUM_USERNAME: 3,
  MAXIMUM_USERNAME: 32,
}

const ERRORS = {
  USERNAME_TO_SHORT: `Username must be at least ${LENGTH.MINIMUM_USERNAME} characters`,
  USERNAME_TO_LONG: `Username must be less than ${LENGTH.MAXIMUM_USERNAME} characters`,
  PASSWORD_TO_SHORT: `Password must be at least ${LENGTH.MINIMUM_PASSWORD} characters`,
  PASSWORD_DOESNT_MATCH: "Passwords doesn't match",
  INCORRECT_EMAIL: "Email is not correct",
  WRONG_CREDENTIAL_EMAIL: "Email or password is not correct",
  WRONG_CREDENTIAL_USERNAME: "username or password is not correct",
}  

const Login = () => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loggingWithUsername, setLoggingWithUsername] = useState(false)
  const [alreadySendRequest, setAlreadySendRequest] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams({});
  const [errors, setErrors] = useState<String[]>([])
  const controller = new AbortController()

  const clearFields = () => {
    setLoggingWithUsername(true)
      setPassword("")
      setUsername("")
      setEmail("")
  }

  const changeFormOfLogging = (changeToUsername: boolean) => {
    if(changeToUsername){
      clearFields()
      setLoggingWithUsername(true)
      setSearchParams({...searchParams, form: "username" });
      return
    }

    clearFields()
    setLoggingWithUsername(false)
    setSearchParams({...searchParams, form: "email" });
  }

  useEffect(() => {
    if(searchParams.get("form")==="email"){
      setLoggingWithUsername(false)
      return
    }
    setLoggingWithUsername(true)
    setSearchParams({...searchParams, form: "username" });
  }, []);

  const loginWithGoogle = () => {
    if(alreadySendRequest) return  
    const { signal } = controller
    setAlreadySendRequest(true)
      
    fetch(googleSignUpRoute,{
      method: "GET",
      signal,
      headers: {
          'Content-type': 'application/json; charset=UTF-8',
      }})
      .then(response => response.json())
      .then(response => {
        if(("error" in response)){
            setErrors(response.error)
        }
        window.location.href = response.link;
      })
      .catch((error)=>{console.log(error)})
      .finally(()=>setAlreadySendRequest(false))
  }

const loginWithUsername = () => {
  const errorsInForm = []
  if(password.length<LENGTH.MINIMUM_PASSWORD){ 
    errorsInForm.push(ERRORS.PASSWORD_TO_SHORT) 
  }
  if(username.length<LENGTH.MINIMUM_USERNAME){ 
    errorsInForm.push(ERRORS.USERNAME_TO_SHORT) 
  }
  if(username.length>LENGTH.MAXIMUM_USERNAME){ 
    errorsInForm.push(ERRORS.USERNAME_TO_LONG) 
  }    

  if(errorsInForm.length>0){
    setErrors(errorsInForm)
    return
  }

  setAlreadySendRequest(true)
  const { signal } = controller

  const body = {
    "username": username,
    "password": password
  }
  fetch(usernameLoginRoute,{
    method: "POST",
    signal,
    body: JSON.stringify(body),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }})
    .then(response => {
      return response.json()})
    .then(response => {
      if("error" in response){
          setErrors([ERRORS.WRONG_CREDENTIAL_USERNAME])
          return
      }
      window.location.href = "/";
    })
    .catch((error)=>{console.log(error)})
    .finally(()=>setAlreadySendRequest(false))
}

const loginWithEmail = () => {
  const errorsInForm = []
  if(password.length<LENGTH.MINIMUM_PASSWORD){ 
    errorsInForm.push(ERRORS.PASSWORD_TO_SHORT) 
  }
  if(!validateEmail(email)){ 
    errorsInForm.push(ERRORS.INCORRECT_EMAIL) 
  }

  if(errorsInForm.length>0){
    setErrors(errorsInForm)
    return
  }

  setAlreadySendRequest(true)
  const { signal } = controller

  const body = {
    "email": email,
    "password": password
  }
  fetch(emailLoginRoute,{
    method: "POST",
    signal,
    body: JSON.stringify(body),
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }})
    .then(response => response.json())
    .then(response => {
      if("error" in response){
        setErrors([ERRORS.WRONG_CREDENTIAL_EMAIL])
        return
      }
      window.location.href = "/";
    })
    .catch((error)=>{console.log(error)})
    .finally(()=>setAlreadySendRequest(false))
  }

  useEffect(() => {
    document.title = 'Login';
  }, []);

  const login = () => {
    if(alreadySendRequest) return

    if(loggingWithUsername)loginWithUsername()
    else loginWithEmail() 
  }
  
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const submitForm = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if(e.key === "Enter"){
      e.preventDefault()
      login()
    }
    
  }

  return (
    <div className="container">
      <div className="glass-modal">
        <div className="background">
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <div className="form">
          <form onKeyDown={(e)=>submitForm(e)}>
            <h3>Login Here</h3>
            {loggingWithUsername?
                <>
                  <label htmlFor="username">Username</label>
                  <input className="input-login" value={username} onChange={(e)=>setUsername(e.target.value)} type="text" placeholder="Username" id="username"/>
                </>
              :
                <>
                  <label htmlFor="email">Email</label>
                  <input className="input-login" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="Email" id="email"/>
                </>
            }
            <label htmlFor="password">Password</label>
            <input className="input-login" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Password" id="password"/>
            </form>
            {errors.map((error, index) => (
              <div className="error-alert" key={index}>{error}.</div>
            ))}  
            <div className="small-helper">Don't have account yet sing up <Link to={`/sign-up`}>here</Link></div>
            <div className="button-container">
              <button onClick={()=>login()} className="btn apply">Login</button>
              {loggingWithUsername?
                <button onClick={()=>changeFormOfLogging(false)} className="btn apply">Login With Email</button>
              :
                <button onClick={()=>changeFormOfLogging(true)} className="btn apply">Login With Username</button>
              }
              
              <button onClick={()=>loginWithGoogle()} className="google-btn">
                <div className="google-icon-wrapper">
                  <img className="google-icon" src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"/>
                </div>
                <p className="btn-text"><b>Sign in with google</b></p>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;