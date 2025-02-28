import linkedin from '../assets/linkedin.png'
import github from '../assets/github.png'

function Footer() {
    return (
        <>
            <footer>
            <a href="https://www.linkedin.com/in/david-alan-todd" target="_blank" rel="noreferrer opener">
                    <img src={linkedin} alt="linkedin logo"/>
            </a>
            <a href="https://github.com/davidalantodd/" target="_blank" rel="noreferrer opener">
                <img src={github} alt="Github Logo"/>
            </a>
            <p>&copy;2025 David Todd</p>
            </footer>
        </>
    )
}

export default Footer