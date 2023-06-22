import React, { useEffect, useState } from "react";
import "./Authorization.css";
import { useSearchParams } from "react-router-dom";
import { emailSignupRoute, googleSignUpRoute, usernameSignupRoute } from "../../routes";
import { Link } from "react-router-dom";

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
  NOT_UNIQUE_EMAIL: "Email already taken",
  NOT_UNIQUE_USERNAME: "Username already taken",
}  

const SignUp = () => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [signUpWithUsername, setSignUpWithUsername] = useState(false)
  const [alreadySendRequest, setAlreadySendRequest] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams({});
  const [errors, setErrors] = useState<String[]>([])
  const controller = new AbortController()
  
  const clearFields = () => {
    setSignUpWithUsername(true)
      setPassword("")
      setUsername("")
      setEmail("")
  }

  const changeFormOfSignUp = (changeToUsername: boolean) => {
    if(changeToUsername){
      clearFields()
      setSignUpWithUsername(true)
      setSearchParams({...searchParams, form: "username" });
      return
    }

    clearFields()
    setSignUpWithUsername(false)
    setSearchParams({...searchParams, form: "email" });
  }

  useEffect(() => {
    if(searchParams.get("form")==="email"){
      setSignUpWithUsername(false)
      return
    }
    setSignUpWithUsername(true)
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
            return
        }
        window.location.href = response.link;
      })
      .catch((error)=>{console.log(error)})
      .finally(()=>setAlreadySendRequest(false))
  }

  const signUpUsername = () => {
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
    if(password!==password2){ 
      errorsInForm.push(ERRORS.PASSWORD_DOESNT_MATCH) 
    }   

    setErrors(errorsInForm)
    if(errorsInForm.length>0){
      return
    }

    setAlreadySendRequest(true)
    const { signal } = controller

    const body = {
      "username": username,
      "password": password
    }
    fetch(usernameSignupRoute,{
      method: "POST",
      signal,
      body: JSON.stringify(body),
      headers: {
          'Content-type': 'application/json; charset=UTF-8',
      }})
      .then(response => response.json())
      .then(response => {
        if("error" in response){
            setErrors([ERRORS.NOT_UNIQUE_USERNAME])
            return
        }
        window.location.href = `/login?form=username`;
      })
      .catch((error)=>{console.log(error)})
      .finally(()=>setAlreadySendRequest(false))
}

const signUpWithEmail = () => {
  const errorsInForm = []
  if(password.length<LENGTH.MINIMUM_PASSWORD){ 
    errorsInForm.push(ERRORS.PASSWORD_TO_SHORT) 
  }
  if(!validateEmail(email)){ 
    errorsInForm.push(ERRORS.INCORRECT_EMAIL) 
  }
  if(password!==password2){ 
    errorsInForm.push(ERRORS.PASSWORD_DOESNT_MATCH) 
  }

  setErrors(errorsInForm)
  if(errorsInForm.length>0){
    return
  }
  
  setAlreadySendRequest(true)
  const { signal } = controller

  const body = {
    "email": email,
    "password": password
  }
  fetch(emailSignupRoute,{
    method: "POST",
    signal,
    body: JSON.stringify(body),
    headers: {
        'Content-type': 'application/json; charset=UTF-8',
    }})
    .then(response => response.json())
    .then(response => {
      if("error" in response){
        setErrors([ERRORS.NOT_UNIQUE_EMAIL])
        return
      }
      window.location.href = `/login?form=email`;
    })
    .catch((error)=>{console.log(error)})
    .finally(()=>setAlreadySendRequest(false))
  }

  const signUp = () => {
    if(alreadySendRequest) return

    if(signUpWithUsername)signUpUsername()
    else signUpWithEmail() 
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
      signUp()
    }
    
  }

  useEffect(() => {
    document.title = 'Sign up';
  }, []);

  return (
    <div className="container">
      <div className="glass-modal">
        <div className="background">
          <div className="shape"></div>
          <div className="shape"></div>
        </div>
        <div className="form">
          <form onKeyDown={(e)=>submitForm(e)}>
            <h3>Sign up</h3>
            {signUpWithUsername?
                <>
                  <label className="label-login" htmlFor="username">Username</label>
                  <input className="input-login" value={username} onChange={(e)=>setUsername(e.target.value)} type="text" placeholder="Username" id="username"/>
                </>
              :
                <>
                  <label className="label-login" htmlFor="email">Email</label>
                  <input className="input-login" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="Email" id="email"/>
                </>
            }
            <label className="label-login" htmlFor="password">Password</label>
            <input className="input-login" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Password" id="password"/>
            <label className="label-login" htmlFor="password">Repeat Password</label>
            <input className="input-login" value={password2} onChange={(e)=>setPassword2(e.target.value)} type="password" placeholder="Repeat Password" id="password2"/>
          </form>  
          {errors.map((error, index) => (
            <div className="error-alert" key={index}>{error}.</div>
          ))}
          <div className="small-helper">Have account already login <Link to={`/login`}>here</Link></div>
          <div className="button-container">
            <button onClick={()=>signUp()} className="btn apply">Sign up</button>
            {signUpWithUsername?
              <button onClick={()=>changeFormOfSignUp(false)} className="btn apply">Sign up With Email</button>
            :
              <button onClick={()=>changeFormOfSignUp(true)} className="btn apply">Sign up With Username</button>
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

export default SignUp;