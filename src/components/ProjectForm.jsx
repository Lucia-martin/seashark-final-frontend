import { useState } from 'react'

export default function ProjectForm({ id, name, onNewProject, onEditProject }) {
  const [newName, setName] = useState(name)

  function handleSubmit(event) {
    event.preventDefault()
    if (onNewProject) {
        onNewProject(newName)
    }
    setName('')
  }

  return (
    
    <form className="projectForm" onSubmit={handleSubmit}>
      <br />
      <input
        type="text"
        onChange={(e) => setName(e.target.value)}
        value={newName}
        placeholder="NEW PROJECT NAME"
      />
      {onNewProject ? (
        <button type="submit" disabled={newName == ""}>ADD PROJECT</button>
      ) : (
        <button
          onClick={() => {
            setName('')
            onEditProject(id, newName)
          }}
          type="button"
        >
          SUBMIT EDIT
        </button>
      )}
    </form>
  )
}
