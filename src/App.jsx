import { useState, useEffect } from 'react'
import Lobby from './components/Lobby'
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'
import './App.css'
import ProjectForm from './components/ProjectForm'
import Todos from './components/Todos'


function App() {
  const [connection, setConnection] = useState()
  const [projects, setProjects] = useState([])
  const [todos, setTodos] = useState([])
  const [edit, setEdit] = useState(false)
  const [projectEditForm, setProjectEditForm] = useState()
  const [user, setUser] = useState('')
  const [currentProject, setCurrentProject] = useState({})

  const fetchProjects = async () => {
    const results = await fetch('/api/projects')
    const data = await results.json()
    setProjects(data)
  }

  useEffect(() => {
    if (!connection) {
      fetchProjects()
      console.log(projects)
      return
    }
 
    connection.on('CreateProject', (project) => {
      setProjects((projects) => [project, ...projects])
    })

    connection.on('DeleteProject', (id) => {
      setProjects((projects) => projects.filter((p) => p.id !== id))
    })

    connection.on('EditProject', (project) => {
      console.log("proj", project)
      setProjects((projects) =>
        projects.map((p) => {
          if (p.id == project.id) {
            return { ...p, name: project.name }
          } else {
            return p
          }
        }),
      )

      setEdit(false)

    })

    connection.on('ReceiveTodo', (todo) => {
      setTodos((todos) => [...todos, { ...todo }])
    })

    connection.on('DeleteTodo', (id) => {
      setTodos((todos) => todos.filter((c) => c.id !== id))
    })

    connection.on('EditTodo', (todo) => {
      setTodos((todos) =>
        todos.map((t) => {
          if (t.id == todo.id) {
            return { ...t, text: todo.text, completed:todo.completed }
          } else {
            return t
          }
        }),
      )
    })

    return () => {
      connection.off('CreateProject')
      connection.off('DeleteProject')
      connection.off('EditProject')
      connection.off('ReceiveTodo')
      connection.off('DeleteTodo')
      connection.off('EditTodo')
    }
  }, [connection])
  
  const submitProject = (name) => {
    fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.toUpperCase(),
      }),
    })
  }

  const deleteProject = (id) => {
    fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    setTodos([])
    setEdit(false)
  }

  const editProject = (id, name) => {
    const projectEditForm = (
      <ProjectForm id={id} name={name} onEditProject={handleEditProject} />
    )
    setProjectEditForm(projectEditForm)
    if (edit) {
      setEdit(false)
      return
    }
    setEdit(true)
  }

  const handleEditProject = (id, name) => {
    fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        name: name,
      }),
    })
  }

  const handleJoin = (id, projectName, username) => {
    if (currentProject.channelId) {
      connection.invoke(
        'RemoveFromGroup',
        currentProject.projectId.toString(),
        currentProject.projectName,
        username,
      )}
    setTodos([])
    connection.invoke('AddToGroup', id.toString(), projectName, username)
    setCurrentProject({ ProjectName: projectName, projectId: id })
    
    fetchTodos(id)
  }

  const fetchTodos = async (id) => {
    const results = await fetch(`/api/todos/${id}/todos`)
    const data = await results.json()
    setTodos((todos) => [...data, ...todos])
  }

  const createConnection = async (user) => {
    try {
      const connection = new HubConnectionBuilder()
        .withUrl('/r/projectsHub')
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build()

      setUser(user)

      await connection.start()
      // await connection.invoke("JoinRoom", {user})
      setConnection(connection)
    } catch (e) {
      console.log(e)
    }
  }

  const sendTodo = async (text) => {
    let sentiment;
    fetch(`/api/predict/?content=${text}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json()).then((json) => sentiment = `${json.scores[0].key},${json.scores[1].key}`)
    .then(() => {
      fetch(`/api/projects/${currentProject.projectId}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user,
          projectId: currentProject.projectId.toString(),
          text: text,
          completed: false, 
          tag: sentiment
        }),
      })
    })
  
    
  }

  const deleteTodo = async (id) => {
    fetch(`/api/todos/${currentProject.projectId}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const completeTodo = async (id, text, completed, tag) => {
    fetch(`/api/todos/${currentProject.projectId}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        completed: completed,
        username: user,
        projectId: currentProject.projectId.toString(),
        id: id,
        tag:tag
      }),
    })
  }
  
  const editTodo = async (id, text, completed) => {
    fetch(`/api/todos/${currentProject.projectId}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        completed:completed,
        username: user,
        projectId: currentProject.projectId.toString(),
        id: id,
      }),
    })
  }

  return (
  <div>
      {!connection ? (
           <Lobby createConnection={createConnection} />
      ) : (
        <div>
          

          <span className="projects">
          {!edit ? (
                    <ProjectForm onNewProject={submitProject} name="" />
              ) : (
                    <>{projectEditForm}</>
              )}
           {projects.map((project, index) => (
                <div  key={index}>
                  <div key={index}>
                    <div className="project">
                      {project.name}
                      &nbsp;
                      <div>
               
                         <svg  onClick={() => deleteProject(project.id)}  height="18px" fill="#eea039" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"> Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.<path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                         <svg  onClick={() => editProject(project.id, project.name)} height="18px" fill="#eea039" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"> Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.<path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>
                           <span className="svgContainer" onClick={() =>
                            handleJoin(project.id, project.name, user)}>
                           <svg className="doorClosed" 
                           xmlns="http://www.w3.org/2000/svg" height="18px" fill="#eea039" viewBox="0 0 576 512"> Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.<path d="M96 64c0-35.3 28.7-64 64-64H416c35.3 0 64 28.7 64 64V448h64c17.7 0 32 14.3 32 32s-14.3 32-32 32H432 144 32c-17.7 0-32-14.3-32-32s14.3-32 32-32H96V64zM384 288a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></svg>
                           
                           <svg className="doorOpen" height="18px" fill="#eea039" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"> Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc.<path d="M320 32c0-9.9-4.5-19.2-12.3-25.2S289.8-1.4 280.2 1l-179.9 45C79 51.3 64 70.5 64 92.5V448H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H96 288h32V480 32zM256 256c0 17.7-10.7 32-24 32s-24-14.3-24-32s10.7-32 24-32s24 14.3 24 32zm96-128h96V480c0 17.7 14.3 32 32 32h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H512V128c0-35.3-28.7-64-64-64H352v64z"/></svg>
                           
                           </span>

                      </div>
                    </div>
                  </div>
                 
                </div>
            ))}
            </span>
             
              <Todos
              todos={todos}
              sendTodo={sendTodo}
              user={user}
              editTodo={editTodo}
              deleteTodo={deleteTodo}
              completeTodo={completeTodo}
              currentProject={currentProject.projectId}
            />
        </div>
        
      )}
      </div>
  )
}

export default App
