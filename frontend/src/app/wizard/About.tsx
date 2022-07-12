import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { Close } from '@mui/icons-material';
import { useAbout } from 'app/query';

const About = () => {
  
  const [ aboutOpen, setAboutOpen ] = useAbout();

  return (
    <Dialog open={!!aboutOpen} onClose={() => setAboutOpen(false)}>
      <DialogTitle>
        <h1>About</h1>
      </DialogTitle>
      <DialogContent>
        <h3>What is GrantExplorer?</h3>
        <p>GrantExplorer is a free, open-source tool for examining the phrases funded by U.S. federal agencies. This includes more than 600,000 grants from the National Science Foundation (NSF), National Institutes of Health (NIH), and Department of Defense (DoD). For example, one could ask the following questions: how much funding has been devoted to &quot;data science&quot; at the NSF? How many &quot;mRNA&quot; grants have been funded at the NIH? What defense agencies have funded &quot;artificial intelligence&quot;? What are related terms for &quot;block chain&quot;?</p>
        <h3>Why did you create this tool and who is aimed at?</h3>
        <p>Grant data from many federal agencies is openly available. Anyone can run this kind analysis on their own. However, it is not available in a form that is quick and easy to analyze. One would have to download large XML files, clean the data, and find the right software. We wanted to make it easy for anyone to examine this data in a web browser with the most up-to-date data. This could be useful for researchers applying for grants, philanthropists developing research portfolios, or government leaders wanting to assess technology trends. There are other similar (and great), free resources and websites that make grant data available, including <a href="https://www.usaspending.gov" target="_blank" rel="noreferrer">USAspending.gov</a>, but none of them provide the functionality for the type of research questions and term exploration that we were looking for.</p>
        <h3>Who created the tool?</h3>
        <p>The tool was born following a conversation between Chris Mentzel and Adam Jones at the Moore Foundation and Jevin West at the University of Washington. There seemed to be no tool for easily exploring what terms are being funded, how those terms are changing, and what new terms are emerging. We are still working on adding new features, but the current version allows one to explore some aspects of these questions. This is important to philanthropists wanting to complement rather than replicate federal research funding. It also allows funders to track the growth of emergent terms in grant data. The tool itself was built by Jesse &quot;Cole&quot; Chamberlin and Jason Portenoy, both former students at the DataLab (Information School, University of Washington). Cole developed the language model and frontend and Jason aggregated and engineered the data backend.</p>
        <h3>Is it really free?</h3>
        <p>Yes, it is free. There is no cost and no freemium model. Our data and tools are openly available with this open source license [open source license]. The only thing we ask is that you cite the project if you use it in publications or elsewhere:</p>
        <p><strong>Chamberlin, Cole and Portenoy, Jason and West, Jevin. (2022) <i>GrantExplorer.org.</i> DataLab, Information School, University of Washington.</strong></p>
        <h3>Who funded the tool?</h3>
        <p>The <a href="https://www.moore.org/" target="_blank" rel="noreferrer">Moore Foundation</a> funded the development of the tool.</p>
        <h3>Will the data be updated and will new functionality be added?</h3>
        <p>The NSF, NIH, and DoD grant data will be updated as it becomes available. We plan to expand to other federal agencies that make their grant data openly available. New functionality depends on time availability on our side but also need from users. If you would like us to add something new to the tool, please email us [email address].</p>
        <h3>When was the data last updated?</h3>
        <p>
          <ul>
            <li>NSF: July, 2022</li>
            <li>NIH: Oct, 2021 (R01 grants only)</li>
            <li>DoD: Jan, 2022</li>
          </ul>
        </p>
        <h3>Who can I contact about the tool?</h3>
        <p>Please feel free to email us [email address] if you have any questions or requests.</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAboutOpen(false)}><Close />Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default About;