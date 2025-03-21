import { useContext, useEffect, useState } from 'react'
import { FontIcon, Stack, TextField } from '@fluentui/react'
import { DefaultButton, PrimaryButton, IconButton } from '@fluentui/react/lib/Button';
import { SendRegular, ArrowDownloadFilled } from '@fluentui/react-icons'

import styles from './PreBuiltPrompt.module.css'
import { ChatMessage } from '../../api'
import { AppStateContext } from '../../state/AppProvider'
import { resizeImage } from '../../utils/resizeImage'
interface Props {
  onSend: (question: ChatMessage['content'], id?: string) => void
  disabled: boolean
  placeholder?: string
  clearOnSend?: boolean
  conversationId?: string
  messageList: ChatMessage[]
}

export const PreBuiltPrompt = ({ onSend, disabled, placeholder, clearOnSend, conversationId, messageList }: Props) => {
  const [question, setQuestion] = useState<string>('')
  const [token, setToken] = useState<any>('')
  const [promptList, setPromptList] = useState<any[]>([])
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const appStateContext = useContext(AppStateContext)
  const OYD_ENABLED = appStateContext?.state.frontendSettings?.oyd_enabled || false;

  useEffect(() => {
    getPromptFromServer();
  }, []);



  useEffect(() => {
    if (question.trim()) {
      sendQuestion();
    }
  }, [question]);

  const getPromptFromServer = async() => {
    const queryParams = new URLSearchParams(window.location.search);
    const qToken = queryParams.get("token");
    setToken(qToken);
    let paramValueDK: any = {};
    paramValueDK["sort"] = [{ "name": 'Name', "order": 'asc' }];
    paramValueDK["filters"] = [{ name: 'DomainKnowledgeCategoryID', value: 'd84f411f-b134-427d-bab8-ca13baf08005', op: 'like' }]
    //taql: JSON.stringify(paramValueDK)
    
    const response = await fetch(`https://api.casetools.truckaccidents.com/crud/DomainKnowledge?taql=${encodeURI(JSON.stringify(paramValueDK))}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': `${qToken}`
      }
    });
    const data = await response.json();
    setPromptList(data.data);
  }
    
    
  const sendQuestion = async() => {
    const questionTest: ChatMessage["content"] =  question.toString();

    if (conversationId && questionTest !== undefined) {
      onSend(questionTest, conversationId)
    } else {
      onSend(questionTest)
    }

    if (clearOnSend) {
      setQuestion('')
    }
  }
  
  const onEnterPress = (ev: React.KeyboardEvent<Element>) => {
    if (ev.key === 'Enter' && !ev.shiftKey && !(ev.nativeEvent?.isComposing === true)) {
      ev.preventDefault()
      sendQuestion()
    }
  }
  
  const onQuestionChange = (_ev: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    setQuestion(newValue || '')
  }


  // const { disabled, checked } = Props;
  const preBuildPrompt = function (question: any) {
    console.log('prebuilt prompt Clicked');
    setQuestion(question);
    console.log('question sent');

  }

  const getLastMessage = async() => {
    if(messageList.length <= 0) 
      return;

    await fetch(`https://api.casetools.truckaccidents.com/ai-chat/getChatDocument`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': `${token}`,
        Accept: 'application/octet-stream',
        responseType: 'blob'
      },
      body: JSON.stringify({
        message: messageList[messageList.length - 1].content
      })
    }).then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `ResponseOfQuestion.docx`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  }



  return (
    <Stack horizontal className={styles.prebuiltPromptContainer}>
      <div className={ styles.prebuiltPromptContainerMainDiv }>
      {
        promptList.map((prompt: any) => {
          return (
            <DefaultButton text={prompt.Name} onClick={()=>preBuildPrompt(prompt.Description)} allowDisabledFocus className={ styles.prebuiltPromptButton } />
          )
        })
        
      }
      {/* <DefaultButton text="Chronology of underlying facts" onClick={preBuildPrompt} allowDisabledFocus className={ styles.prebuiltPromptButton }  />
      <DefaultButton text="Download as Word" onClick={getLastMessage} allowDisabledFocus  className={ styles.prebuiltDownloadButton } /> 
      <IconButton iconProps={{iconName: 'Download'}} title="Download as Word" onClick={getLastMessage} allowDisabledFocus className={ styles.prebuiltDownloadButton } />
      */}
      </div>
      <div className={ styles.prebuiltPromptContainerSecondDiv } title='Download last response'>
        <ArrowDownloadFilled fontSize={30}   title="Download last response" onClick={getLastMessage} className={ styles.prebuiltDownloadButton } />
      </div>
        
    </Stack>
    
  )
}
