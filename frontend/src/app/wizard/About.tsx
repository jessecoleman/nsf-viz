import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Link } from '@material-ui/core';
import { Close } from '@mui/icons-material';
import { useAbout, useTutorial } from 'app/query';
import { MouseEvent } from 'react';

const About = () => {
  
  const [ aboutOpen, setAboutOpen ] = useAbout();
  const [ , setTutorial ] = useTutorial();
  const openTutorial = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAboutOpen(false);
    setTutorial(0);
  };

  return (
    <Dialog open={!!aboutOpen} onClose={() => setAboutOpen(false)}>
      <DialogTitle>
        <h1>About GrantExplorer</h1>
      </DialogTitle>
      <DialogContent>
        <h3>What is GrantExplorer?</h3>
        <p>GrantExplorer is a free, open-source tool for examining the phrases funded by U.S. federal agencies. This includes more than a half-million grants from the National Science Foundation (NSF), National Institutes of Health (NIH), and Department of Defense (DoD).</p>
        <p>For example, one could ask the following questions: how much funding has been devoted to &quot;data science&quot; at the NSF? How many &quot;mRNA&quot; grants have been funded at the NIH? What defense agencies have funded &quot;artificial intelligence&quot;? What are related terms for &quot;block chain&quot;?</p>
        <h3>Why did you create this tool and who is it aimed at?</h3>
        <p>Grant data from many federal agencies is openly available. Anyone can run this kind of analysis on their own. However, it is not available in a form that is quick and easy to analyze. One would have to download large XML files, clean the data, and find the right software. We wanted to make it easy for anyone to examine this data in a web browser with the most up-to-date data. This could be useful for researchers applying for grants, philanthropists developing research portfolios, or government leaders wanting to assess technology trends.</p>
        <p>There are other similar (and great), free resources and websites that make grant data available, including <Link href="https://www.usaspending.gov" target="_blank" rel="noopener">USAspending.gov</Link>, but none of them provide the functionality for the type of research questions and term exploration that we were looking for.</p>
        <h3>How do I use it?</h3>
        <p><Link onClick={openTutorial} style={{cursor: 'pointer'}}>Click here to view the tutorial.</Link></p>
        <h3>Who created the tool?</h3>
        <p>The tool was born following a conversation between Chris Mentzel and Adam Jones at the <Link href="https://www.moore.org/">Moore Foundation</Link> and <Link href="https://jevinwest.org/">Jevin West</Link> at the University of Washington. There seemed to be no tool for easily exploring what terms are being funded, how those terms are changing, and what new terms are emerging. We are still working on adding new features, but the current version allows one to explore some aspects of these questions. This is important to philanthropists wanting to complement rather than replicate federal research funding. It also allows funders to track the growth of emergent terms in grant data.</p>
        <p>The tool itself was built by <Link href='https://www.linkedin.com/in/chamb-jc'>Jesse &quot;Cole&quot; Chamberlin</Link> and <Link href="https://www.jasport.org/">Jason Portenoy</Link>, both former students at the DataLab (Information School, University of Washington). Cole developed the language model and frontend and Jason aggregated and engineered the data backend.</p>
        <h3>Is it really free?</h3>
        <p>Yes, it is free. There is no cost and no freemium model. Our data and tools are openly available with this open source license [open source license]. The only thing we ask is that you cite the project if you use it in publications or elsewhere:</p>
        <p><strong>Chamberlin, Jesse and Portenoy, Jason and West, Jevin. (2022) <i>GrantExplorer.org.</i> DataLab, Information School, University of Washington.</strong></p>
        <h3>Who funded the tool?</h3>
        <p>The <Link href="https://www.moore.org/" target="_blank" rel="noreferrer">Moore Foundation</Link> funded the development of the tool.</p>
        <h3>Will the data be updated and will new functionality be added?</h3>
        <p>The NSF, NIH, and DoD grant data will be updated as it becomes available. We plan to expand to other federal agencies that make their grant data openly available.</p>
        <p>New functionality depends on time availability on our side but also need from users. If you would like us to add something new to the tool, please <Link href="mailto:jevinw@uw.edu?subject=GrantExplorer">email us</Link>.</p>
        <h3>When was the data last updated?</h3>
        <p>
          <ul>
            <li>NSF: September 2023 (soon-to-be funded grants are included, which is why 2023 is listed)</li>
            <li>NIH: Oct, 2021 (R01 grants only)</li>
            <li>DoD: Jan, 2022</li>
          </ul>
        </p>
        <h3>So, what is one of the most funded terms? </h3>
        <p>One of the most funded terms at the NSF over the last couple decades is &quot;new&quot; (only slightly behind terms such as &quot;research&quot;, &quot;development&quot;, and &quot;project&quot;). Funders really do seem to like newness.</p>
        <p>This kind of analysis is not so straightforward, though. Does one look at unigrams, bigrams, trigrams, etc? Do one focus on one year and one agency? What common terms should be removed?</p>
        <p>We are working on more sophisticated analyses of this data and know that others have done good work in this area. We plan to post on these soon. If you are interested in this data, we are happy to share.</p>
        <h3>Want to test the beta features?</h3>
        <p>
          Feel free to try out some beta features (that may be a little buggy). Just click on the green flask icon to the lower right. That will enable topic recommenders and other &quot;new&quot;, experimental features.
        </p>
        <h3>Who can I contact about the tool?</h3>
        <p>Please feel free to email <Link href="mailto:jevinw@uw.edu?subject=GrantExplorer">Jevin West</Link> if you have any questions or requests.</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAboutOpen(false)}><Close />Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default About;