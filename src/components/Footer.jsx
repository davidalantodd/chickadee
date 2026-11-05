import linkedin from '../assets/linkedin.png'
import github from '../assets/github.png'

function Footer() {
    const currentYear = new Date().getFullYear();
    return (
        <>
            <footer>
            <p className="data-attribution">
                Bird observation data from <a href="https://ebird.org" target="_blank" rel="noreferrer">eBird.org</a>, Cornell Lab of Ornithology.
                Chickadee is not affiliated with or endorsed by the Cornell Lab of Ornithology.
            </p>
            <div className="footer-links">
            <a href="https://www.linkedin.com/in/david-alan-todd" target="_blank" rel="noreferrer opener">
                    <img src={linkedin} alt="linkedin logo"/>
            </a>
            <a href="https://github.com/davidalantodd/" target="_blank" rel="noreferrer opener">
                <img src={github} alt="Github Logo"/>
            </a>
            <p>&copy;{currentYear} David Todd</p>
            </div>
            </footer>
        </>
    )
}

export default Footer